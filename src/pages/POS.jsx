import Form from "@/components/custom/Form";
import PageLayout from "@/layout/PageLayout";
import IInput from "@/components/custom/Input";
import { HOME, POINT_OF_SALE } from "@/constants/routes";
import { searchSchema } from "@/lib/zod/schema/search";
import { Loader2, RefreshCcwIcon, SearchIcon, ShoppingCart, Trash2, Menu } from "lucide-react";
import PointOfSaleItem from "@/components/custom/PointOfSaleItem";
import ICard from "@/components/custom/Card";
import { useDispatch, useSelector } from "react-redux";
import {
   addCart,
   clearCart,
   resetCheckout,
   setPaymentMethod,
   setSearchQuery,
   setShowLowStock,
   setShowProcessPayment,
   setShowInvoiceNumberModal,
   updateCart,
   setCategory,
   setAmountTendered,
   setInvoiceNumber,
   setIsDeduction,
   setRemarks,
   setCart,
} from "@/features/slice/cartSlice";
import CartItem from "@/components/custom/CartItem";
import Fallback from "./Fallback";
import Title from "@/components/custom/Title";
import {
   useGetInventoryListWithStockQuery,
   useBulkDeductStocksMutation,
} from "@/features/api/inventory";
import Each from "@/components/custom/Each";
import Suspense from "@/components/custom/Suspense";
import { Button } from "@/components/ui/button";
import Paragraph from "@/components/custom/Paragraph";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@radix-ui/react-dropdown-menu";
import IButton from "@/components/custom/Button";
import IRadioGroup from "@/components/custom/RadioGroup";
import { PAYMENT_METHOD_OPTIONS } from "@/constants/payment";
import { useConfirmation } from "@/helpers/confirmAction";
import AnimatedNumber from "@/components/custom/AnimatedNumber";
import { toast } from "sonner";
import { posTransactionSchema, cartItemSchema } from "@/lib/zod/schema/transaction";
import { optionParser, priceParser } from "@/helpers/parser";
import ICheckbox from "@/components/custom/Checkbox";
import ProcessPayment from "@/components/modals/pos/ProcessPayment";
import InvoiceNumber from "@/components/modals/pos/InvoiceNumber";
import { useCheckoutOrderMutation } from "@/features/api/order";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { useEffect } from "react";
import BarcodeScanner from "@/components/custom/BarcodeScanner";
import { setBarcodeValue, setEnableBarcodeScanner } from "@/features/slice/barcodeSlice";
import { printInvoice } from "@/helpers/printInvoice";
import ISelect from "@/components/custom/Select";
import { useGetCategoryListQuery } from "@/features/api/category";

const breadcrumbItems = [{ label: HOME.title }, { label: POINT_OF_SALE.title }];

export default function POS() {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const [checkourOrder] = useCheckoutOrderMutation();
   const [bulkDeduct] = useBulkDeductStocksMutation();

   const { enableBarcodeScanner, barcodeValue } = useSelector((state) => state.barcode);
   const {
      searchQuery,
      cart,
      category,
      paymentMethod,
      showLowStock,
      showProcessPayment,
      showInvoiceNumberModal,
      amountTendered,
      invoiceNumber,
      isDeduction,
      remarks,
   } = useSelector((state) => state.cart);

   const DEDUCTION_REMARKS_OPTIONS = [
      { label: "Internal Use", value: "Internal Use" },
      { label: "Damage", value: "Damage" },
      { label: "Expired", value: "Expired" },
      { label: "Freebies", value: "Freebies" },
      { label: "Loss", value: "Loss" },
      { label: "Sample", value: "Sample" },
      { label: "Other", value: "Other" },
   ];

   const {
      data: inventoryItems,
      isFetching,
      isLoading,
      refetch,
   } = useGetInventoryListWithStockQuery(
      {
         limit: 20,
         search: searchQuery,
         show_low_stock: showLowStock,
         category,
      },
      {
         refetchOnMountOrArgChange: true,
      },
   );

   const { data: categoryList } = useGetCategoryListQuery();

   const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
   const total = isDeduction ? 0 : subtotal;

   const onSubmit = ({ search, category }) => {
      dispatch(setSearchQuery(search));
      dispatch(setCategory(category));
   };

   const handleShowLowStock = (value) => {
      dispatch(setShowLowStock(value));
   };

   const handleIsDeduction = (value) => {
      dispatch(setIsDeduction(value));
      if (value) {
         dispatch(setPaymentMethod("none"));
      } else {
         dispatch(setPaymentMethod(null));
      }
   };

   const handleEnableBarcodeScanner = (value) => {
      dispatch(setEnableBarcodeScanner(value));
   };

   const addItemToCard = (item) => {
      try {
         // Validate item before adding to cart
         const validatedItem = cartItemSchema.parse({
            ...item,
            quantity: 1,
         });

         if (item.current_qty <= 0) {
            toast.error("Item is out of stock");
            return;
         }

         const existingItem = cart.find(
            (cartItem) => cartItem.id === item.id && !!cartItem.isKit === !!item.isKit,
         );

         if (existingItem) {
            const updatedItem = cartItemSchema.parse({
               ...item,
               quantity: existingItem.quantity + 1,
            });

            if (existingItem.quantity >= item.current_qty) {
               toast.error("Cannot add more items than available in stock");
               return;
            }

            // We need a custom update since the helper only checks id
            const updatedCart = cart.map((cartItem) =>
               cartItem.id === item.id && !!cartItem.isKit === !!item.isKit
                  ? updatedItem
                  : cartItem,
            );
            dispatch(setCart(updatedCart));
         } else {
            dispatch(addCart(validatedItem));
         }
      } catch (error) {
         console.error("Add to cart validation failed:", error);
      }
   };

   const removeAllFromCart = async () => {
      if (!cart.length) return;

      const confirmed = await confirm({
         title: "Remove all items from cart",
         description: "Are you sure you want to remove all items from the cart?",
         variant: "destructive",
      });

      if (confirmed) {
         dispatch(setPaymentMethod(null));
         dispatch(clearCart());
      }
   };

   const handlePaymentMethod = (method) => {
      if (cart.length === 0) {
         toast.error("Cart is empty. Please add items before selecting a payment method.");
         return;
      }

      dispatch(setPaymentMethod(method));
   };

   const onProcessPayment = () => {
      // Pre-validation checks for better UX
      if (!cart.length) {
         toast.error("Cart is empty. Please add items to cart before checkout.");
         return;
      }

      if (isDeduction) {
         onCheckout();
         return;
      }

      if (!paymentMethod) {
         toast.error("Please select a payment method.");
         return;
      }

      // Show invoice number modal first
      dispatch(setShowInvoiceNumberModal(true));
   };

   const onInvoiceNumberSubmit = () => {
      dispatch(setShowInvoiceNumberModal(false));
      dispatch(setShowProcessPayment(true));
   };

   const onInvoiceNumberClose = () => {
      dispatch(setShowInvoiceNumberModal(false));
   };

   const onProcessPaymentClose = () => {
      dispatch(setShowProcessPayment(false));
   };

   const onCheckout = async () => {
      const transactionData = {
         cart,
         paymentMethod: isDeduction ? "none" : paymentMethod,
         subtotal,
         total,
         type: isDeduction ? "deduction" : "sale",
         remarks: isDeduction ? remarks : null,
      };

      try {
         // Skip validation for deduction since payment fields are missing
         let validatedTransaction = transactionData;
         if (!isDeduction) {
            validatedTransaction = posTransactionSchema.parse(transactionData);
         }

         const confirmed = await confirm({
            title: isDeduction ? "Confirm Stock Deduction" : "Process Transaction",
            message: isDeduction
               ? `Are you sure you want to deduct ${cart.length} item(s) from inventory? This action cannot be undone.`
               : `Process payment of ${priceParser(
                    total.toFixed(2).toLocaleString("en-US", {
                       minimumFractionDigits: 2,
                    }),
                 )} via ${paymentMethod}?`,
            confirmLabel: isDeduction ? "Deduct Stock" : "Process Payment",
            cancelLabel: "Cancel",
            variant: isDeduction ? "destructive" : "default",
         });

         if (!confirmed) return;

         const payload = {
            ...validatedTransaction,
            invoiceNumber: isDeduction ? `DDC-${Date.now()}` : invoiceNumber,
            total: Number(validatedTransaction.total.toFixed(2)),
            amountTendered: isDeduction ? 0 : Number(amountTendered).toFixed(2),
            change: isDeduction
               ? 0
               : Number(
                    Number(amountTendered).toFixed(2) -
                       Number(validatedTransaction.total).toFixed(2),
                 ).toFixed(2),
         };

         const id = toast.loading(isDeduction ? "Deducting stock..." : "Processing transaction...");

         const checkoutAction = isDeduction ? bulkDeduct : checkourOrder;

         const result = await exec(checkoutAction, payload);

         if (result.success) {
            const data = result.result;
            toast.success(data.message || "Transaction processed successfully", { id });

            if (!isDeduction) {
               const invoiceInfo = {
                  cart: cart,
                  paymentMethod: payload.paymentMethod,
                  subtotal: payload.subtotal,
                  total: payload.total,
                  amountTendered: payload.amountTendered,
                  change: payload.change,
               };
               printInvoice(
                  invoiceInfo,
                  payload.invoiceNumber || data?.id || `TXN-${Date.now()}`,
                  new Date(),
               );
            }

            dispatch(resetCheckout());
            refetch();
         } else {
            toast.error(result.message || "Failed to process transaction", { id });
         }
      } catch (error) {
         console.log(error);
         toast.error("Failed to process transaction. Please try again.");
      }
   };

   useEffect(() => {
      dispatch(resetCheckout());
      dispatch(setEnableBarcodeScanner(false));
      dispatch(setBarcodeValue(""));
   }, []);

   useEffect(() => {
      if (enableBarcodeScanner && barcodeValue) {
         const item = inventoryItems?.find((invItem) => invItem.serial_number === barcodeValue);
         if (item) {
            addItemToCard(item);
            dispatch(setBarcodeValue(""));
         }
      }
   }, [barcodeValue]);

   return (
      <PageLayout breadcrumbItems={breadcrumbItems} route={POINT_OF_SALE}>
         <main className='flex flex-col lg:flex-row items-start gap-3 w-full h-full relative'>
            <section className='w-full h-full lg:py-6'>
               <Title className='text-lg md:text-4xl'>Sales</Title>
               <Paragraph className='text-sm md:text-base text-muted-foreground mb-4'>
                  Quickly process sales and manage your cart.
               </Paragraph>
               <header className='flex flex-col lg:flex-row items-start lg:items-center gap-2 mb-4'>
                  <Form
                     onSubmit={onSubmit}
                     schema={searchSchema}
                     mode='onChange'
                     debounce={0.5}
                     className='gap-2 flex flex-col lg:flex-row items-stretch lg:items-center w-full lg:w-auto'
                  >
                     <IInput
                        preventEnterSubmit
                        name='search'
                        placeholder='Search'
                        prefix={<SearchIcon className='size-4 text-black' />}
                     />
                     <ISelect
                        name='category'
                        placeholder='Filter by Category'
                        options={optionParser(categoryList, "id", "name")}
                     />
                  </Form>

                  <section className='flex items-center gap-2'>
                     <IButton
                        className='select-none text-xs'
                        variant='ghost'
                        onClick={() => refetch()}
                     >
                        <RefreshCcwIcon className='size-4' />
                        <span className='hidden sm:inline'>Refresh</span>
                     </IButton>

                     <div className='lg:ml-auto space-y-1'>
                        {/* <ICheckbox
                        name='enable_barcode_scanner'
                        label='Enable Barcode Scanner'
                        useForm={false}
                        checked={enableBarcodeScanner}
                        onChange={handleEnableBarcodeScanner}
                     /> */}
                        <ICheckbox
                           name='low_stock'
                           label='Show Item with low stocks'
                           useForm={false}
                           onChange={handleShowLowStock}
                        />
                     </div>
                  </section>
               </header>
               <div className='mt-4 flex flex-wrap gap-2 sm:gap-3 md:gap-4 relative bg-white'>
                  <Suspense
                     loading={isFetching || isLoading}
                     className='mb-40'
                     loader={
                        <div className='flex items-center gap-2'>
                           <Loader2 className='animate-spin size-6 text-muted-foreground' />
                           <Paragraph size='sm'>Loading items...</Paragraph>
                        </div>
                     }
                  >
                     <Each
                        of={inventoryItems}
                        fallbackClassName='mt-0 h-80!'
                        fallback={
                           searchQuery
                              ? "No items found with this filter"
                              : "No item with available stocks found"
                        }
                        render={(item) => (
                           <PointOfSaleItem
                              key={item.id}
                              onClick={() => addItemToCard(item)}
                              included={cart.some((cartItem) => cartItem.id === item.id)}
                              {...item}
                           />
                        )}
                     />
                  </Suspense>
               </div>
            </section>

            <div className='bg-sidebar text-primary-foreground w-full lg:w-130 lg:h-screen lg:sticky! lg:top-0 lg:bottom-0 lg:right-0 flex flex-col border-t lg:border-l lg:border-t-0 px-3 sm:px-4 py-4 sm:py-6 border-outline/50 mt-4 lg:mt-0'>
               <header className='flex items-center justify-between mb-2'>
                  <Title className='mb-2 select-none flex items-center gap-2 text-xl sm:text-2xl'>
                     Cart
                     <ShoppingCart className='size-4 sm:size-5' strokeWidth={2.5} />
                  </Title>

                  <Button
                     variant='destructive'
                     className='select-none text-xs'
                     onClick={removeAllFromCart}
                  >
                     <Trash2 className='size-4' />
                     <span className='hidden sm:inline'>Remove All</span>
                  </Button>
               </header>

               {cart.length > 0 ? (
                  <ScrollArea className='max-h-60 md:max-h-2/3 lg:max-h-[calc(100vh-26rem)] mb-2'>
                     <div className='space-y-2'>
                        <Each of={cart} render={(item) => <CartItem key={item.id} item={item} />} />
                     </div>
                  </ScrollArea>
               ) : (
                  <div className='h-40 sm:h-60 lg:h-1/2'>
                     <Fallback message='No items added' />
                  </div>
               )}

               <ICard
                  cardClassName='mt-auto bg-primary shadow-md py-2 sm:py-3 h-85'
                  cardContentClassName='flex flex-col gap-1 h-full px-2 sm:px-3'
               >
                  <section className='space-y-1 sm:space-y-2 mb-4 sm:mb-7'>
                     <div className='flex items-center justify-between'>
                        <Paragraph className='!text-xs sm:!text-sm text-primary-foreground'>
                           Subtotal
                        </Paragraph>
                        <Paragraph className='!text-xs sm:!text-sm !text-primary-foreground !font-semibold'>
                           <AnimatedNumber value={subtotal} prefix='PHP ' />
                        </Paragraph>
                     </div>

                     <Separator className='my-2 sm:my-2.5 border border-dashed border-gray-400' />

                     <div className='flex items-center justify-between'>
                        <Paragraph className='!text-base sm:!text-lg text-primary-foreground'>
                           Total
                        </Paragraph>
                        <Paragraph className='!text-base sm:!text-lg !text-primary-foreground font-bold'>
                           <AnimatedNumber value={total} prefix='PHP ' className='font-bold' />
                        </Paragraph>
                     </div>
                  </section>

                  <section className='mt-auto sm:mb-3'>
                     <div className='flex items-center justify-between pl-3 pr-1 py-2 rounded-lg bg-white/10'>
                        <Paragraph className='!text-xs sm:!text-sm text-primary-foreground font-medium'>
                           Internal Deduction?
                        </Paragraph>
                        <ICheckbox
                           name='is_deduction'
                           label=''
                           useForm={false}
                           checked={isDeduction}
                           onChange={handleIsDeduction}
                        />
                     </div>

                     {isDeduction && (
                        <ISelect
                           label='Deduction Remark'
                           useForm={false}
                           value={remarks}
                           options={DEDUCTION_REMARKS_OPTIONS}
                           triggerClassName='text-black'
                           className='mt-3'
                           onValueChange={(val) => dispatch(setRemarks(val.value))}
                        />
                     )}

                     {!isDeduction && (
                        <>
                           <Paragraph className='!text-xs sm:!text-sm mt-3 mb-2 text-primary-foreground'>
                              Payment Method
                           </Paragraph>
                           <IRadioGroup
                              className='grid grid-cols-3 gap-1 sm:gap-2'
                              value={paymentMethod}
                              options={PAYMENT_METHOD_OPTIONS}
                              iconAsLabel
                              iconClassName='size-5 sm:size-7 group-hover:scale-110 transition-all'
                              checkedClassName='bg-white text-primary font-bold'
                              itemClassName='bg-white/50 border-2 border-outline/30 text-black p-2 sm:p-3 flex items-center justify-center rounded-md cursor-pointer flex flex-col gap-1 items-center group transition-all'
                              onChange={handlePaymentMethod}
                           />
                        </>
                     )}
                  </section>

                  <section>
                     <IButton
                        variant='emphasis'
                        className='w-full text-sm sm:text-base'
                        onClick={onProcessPayment}
                     >
                        {isDeduction ? "Deduct Stock" : "Process Transaction"}
                     </IButton>
                  </section>
               </ICard>
            </div>

            {enableBarcodeScanner && <BarcodeScanner className='absolute bottom-0 left-0' />}
         </main>

         <InvoiceNumber
            isOpen={showInvoiceNumberModal}
            onSubmit={onInvoiceNumberSubmit}
            onClose={onInvoiceNumberClose}
         />

         <ProcessPayment
            isOpen={showProcessPayment}
            onSubmit={onCheckout}
            onClose={onProcessPaymentClose}
            total={total}
         />
      </PageLayout>
   );
}

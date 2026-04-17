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
} from "@/features/slice/cartSlice";
import CartItem from "@/components/custom/CartItem";
import Fallback from "./Fallback";
import Title from "@/components/custom/Title";
import { useGetInventoryListWithStockQuery } from "@/features/api/inventory";
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
import LogoEmblem from "@/assets/images/logos/logo_emblem.png";
import { printInvoice } from "@/helpers/printInvoice";
import ISelect from "@/components/custom/Select";
import { useGetCategoryListQuery } from "@/features/api/category";
import { ca } from "date-fns/locale";
import { SidebarTrigger } from "@/components/ui/sidebar";

const breadcrumbItems = [{ label: HOME.title }, { label: POINT_OF_SALE.title }];

export default function POS() {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const [checkourOrder] = useCheckoutOrderMutation();

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
   } = useSelector((state) => state.cart);

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
   const total = subtotal;

   const onSubmit = ({ search, category }) => {
      dispatch(setSearchQuery(search));
      dispatch(setCategory(category));
   };

   const handleShowLowStock = (value) => {
      dispatch(setShowLowStock(value));
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

         const existingItem = cart.find((cartItem) => cartItem.id === item.id);

         if (existingItem) {
            const updatedItem = cartItemSchema.parse({
               ...item,
               quantity: existingItem.quantity + 1,
            });

            if (existingItem.quantity >= item.current_qty) {
               toast.error("Cannot add more items than available in stock");
               return;
            }

            dispatch(
               updateCart({
                  id: item.id,
                  data: updatedItem,
               }),
            );
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
         paymentMethod,
         subtotal,
         total,
      };

      try {
         const validatedTransaction = posTransactionSchema.parse(transactionData);

         const confirmed = await confirm({
            title: "Process Transaction",
            message: `Process payment of ${priceParser(
               total.toFixed(2).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
               }),
            )} via ${paymentMethod}?`,
            confirmLabel: "Process Payment",
            cancelLabel: "Cancel",
         });

         if (!confirmed) return;

         const payload = {
            ...validatedTransaction,
            invoiceNumber: invoiceNumber,
            total: Number(validatedTransaction.total.toFixed(2)),
            amountTendered: Number(amountTendered).toFixed(2),
            change: Number(Number(amountTendered).toFixed(2) - Number(validatedTransaction.total).toFixed(2)).toFixed(
               2,
            ),
         };

         const id = toast.loading("Processing transaction...");
         const { success, message, data } = await exec(checkourOrder, payload);

         if (!success) {
            toast.dismiss(id);
            return;
         }

         // Prepare invoice data with full cart details (not just id and quantity)
         const invoiceInfo = {
            cart: cart, // Use original cart with full item details
            paymentMethod: validatedTransaction.paymentMethod,
            subtotal: validatedTransaction.subtotal,
            total: Number(validatedTransaction.total.toFixed(2)),
            amountTendered: payload.amountTendered,
            change: payload.change,
         };

         // Open invoice in new window
         printInvoice(invoiceInfo, invoiceNumber || data?.id || `TXN-${Date.now()}`, new Date());

         dispatch(resetCheckout());
         toast.success(message, { id });
         refetch();
      } catch (error) {
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
                     <IButton className='select-none text-xs' variant='ghost' onClick={() => refetch()}>
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
                           searchQuery ? "No items found with this filter" : "No item with available stocks found"
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

                  <Button variant='destructive' className='select-none text-xs' onClick={removeAllFromCart}>
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
                  cardClassName='mt-auto bg-primary shadow-md py-2 sm:py-3 h-75'
                  cardContentClassName='flex flex-col gap-1 h-full px-2 sm:px-3'
               >
                  <section className='space-y-1 sm:space-y-2 mb-4 sm:mb-7'>
                     <div className='flex items-center justify-between'>
                        <Paragraph className='!text-xs sm:!text-sm text-primary-foreground'>Subtotal</Paragraph>
                        <Paragraph className='!text-xs sm:!text-sm !text-primary-foreground !font-semibold'>
                           <AnimatedNumber value={subtotal} prefix='PHP ' />
                        </Paragraph>
                     </div>

                     <Separator className='my-2 sm:my-2.5 border border-dashed border-gray-400' />

                     <div className='flex items-center justify-between'>
                        <Paragraph className='!text-base sm:!text-lg text-primary-foreground'>Total</Paragraph>
                        <Paragraph className='!text-base sm:!text-lg !text-primary-foreground font-bold'>
                           <AnimatedNumber value={total} prefix='PHP ' className='font-bold' />
                        </Paragraph>
                     </div>
                  </section>

                  <section className='mt-auto mb-2 sm:mb-3'>
                     <Paragraph className='!text-xs sm:!text-sm mb-2 text-primary-foreground'>Payment Method</Paragraph>
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
                  </section>

                  <section>
                     <IButton variant='emphasis' className='w-full text-sm sm:text-base' onClick={onProcessPayment}>
                        Process Transaction
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

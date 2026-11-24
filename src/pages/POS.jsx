import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SearchIcon, ShoppingBasket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import PageLayout from "@/layout/PageLayout";
import { POINT_OF_SALE } from "@/constants/routes";
import PointOfSaleItem from "@/components/custom/PointOfSaleItem";
import CartItem from "@/components/custom/CartItem";
import CheckoutPanel from "@/components/custom/CheckoutPanel";
import ShiftGate, { ShiftStatus } from "@/components/custom/ShiftGate";
import ICheckbox from "@/components/custom/Checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
   addCart,
   clearCart,
   isSameCartLine,
   resetCheckout,
   setCart,
   setCategory,
   setSearchQuery,
   setShowLowStock,
} from "@/features/slice/cartSlice";
import { useBulkDeductStocksMutation, useGetInventoryListWithStockQuery } from "@/features/api/inventory";
import { useGetCategoryListQuery } from "@/features/api/category";
import { useCheckoutOrderMutation } from "@/features/api/order";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { cartItemSchema, posTransactionSchema } from "@/lib/zod/schema/transaction";
import { printOrderReceipt } from "@/helpers/printInvoice";
import { cn } from "@/lib/utils";

const isTypingTarget = (el) =>
   el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

function Chip({ active, children, ...props }) {
   return (
      <button
         type='button'
         aria-pressed={active}
         className={cn(
            "h-8 shrink-0 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            active
               ? "border-primary bg-primary text-white"
               : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500",
         )}
         {...props}
      >
         {children}
      </button>
   );
}

function TileSkeleton() {
   return (
      <div
         className='flex min-h-[152px] flex-col rounded-xl border border-neutral-200 bg-white p-3.5'
         aria-hidden='true'
      >
         <Skeleton className='h-2.5 w-1/3' />
         <Skeleton className='mt-2.5 h-3.5 w-4/5' />
         <div className='mt-auto mb-3 flex items-end justify-between'>
            <Skeleton className='h-4.5 w-1/2' />
            <Skeleton className='size-7 rounded-lg' />
         </div>
         <div className='border-t border-neutral-100 pt-2.5'>
            <Skeleton className='h-3 w-1/3' />
         </div>
      </div>
   );
}

export default function POS() {
   const dispatch = useDispatch();
   const exec = useCatchQuery();
   const [checkoutOrder] = useCheckoutOrderMutation();
   const [bulkDeduct] = useBulkDeductStocksMutation();

   const {
      searchQuery,
      cart,
      category,
      paymentMethod,
      showLowStock,
      amountTendered,
      invoiceNumber,
      isDeduction,
      remarks,
      clientRef,
   } = useSelector((state) => state.cart);

   const role = useSelector((state) => state.user.user?.role);
   const canDeduct = role === "admin" || role === "supervisor";
   const deductionNeedsApproval = role === "supervisor";

   const [search, setSearch] = useState("");
   const debouncedSearch = useDebounce(search, 300);
   const searchRef = useRef(null);
   const chipsRef = useRef(null);
   // Which ends of the category row have more chips hidden past them (drives the edge fades).
   const [chipOverflow, setChipOverflow] = useState({ start: false, end: false });

   const [isSubmitting, setIsSubmitting] = useState(false);
   const [completed, setCompleted] = useState(null);
   const [chargeError, setChargeError] = useState(null);

   const {
      data: inventoryItems,
      isFetching,
      isLoading,
      refetch,
   } = useGetInventoryListWithStockQuery(
      { limit: 20, search: searchQuery, show_low_stock: showLowStock, category },
      { refetchOnMountOrArgChange: true, refetchOnFocus: true },
   );

   const { data: categoryList, isLoading: categoriesLoading } = useGetCategoryListQuery();

   const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
   const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
   const total = isDeduction ? 0 : subtotal;

   // A fresh sale every time the page opens.
   useEffect(() => {
      dispatch(resetCheckout());
   }, [dispatch]);

   useEffect(() => {
      dispatch(setSearchQuery(debouncedSearch.trim()));
   }, [debouncedSearch, dispatch]);

   // "/" focuses the search, like most web tools.
   useEffect(() => {
      const onKey = (e) => {
         if (e.key === "/" && !e.metaKey && !e.ctrlKey && !isTypingTarget(e.target)) {
            e.preventDefault();
            searchRef.current?.focus();
         }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
   }, []);

   const cartQtyFor = useCallback((item) => cart.find((line) => isSameCartLine(line, item))?.quantity ?? 0, [cart]);

   const addItemToCart = useCallback(
      (item) => {
         if (completed) setCompleted(null);
         setChargeError(null);

         if (Number(item.current_qty) <= 0) {
            toast.error(`${item.name} is out of stock`);
            return;
         }

         const existing = cart.find((line) => isSameCartLine(line, item));

         try {
            if (existing) {
               if (existing.quantity >= Number(item.current_qty)) {
                  toast.error(`Only ${item.current_qty} of ${item.name} in stock`);
                  return;
               }
               const updated = cartItemSchema.parse({ ...item, quantity: existing.quantity + 1 });
               dispatch(setCart(cart.map((line) => (isSameCartLine(line, item) ? updated : line))));
            } else {
               dispatch(addCart(cartItemSchema.parse({ ...item, quantity: 1 })));
            }
         } catch (error) {
            console.error("Add to cart validation failed:", error);
            toast.error(`${item.name} can't be sold: its details are incomplete.`);
         }
      },
      [cart, completed, dispatch],
   );

   // Escape clears the search; Enter runs it right away instead of waiting for the debounce.
   const onSearchKeyDown = (e) => {
      if (e.key === "Escape" && search) {
         setSearch("");
         return;
      }
      if (e.key !== "Enter") return;
      e.preventDefault();
      dispatch(setSearchQuery(search.trim()));
   };

   const hasFilters = Boolean(searchQuery || category || showLowStock);
   const clearFilters = () => {
      setSearch("");
      dispatch(setSearchQuery(""));
      dispatch(setCategory(null));
      dispatch(setShowLowStock(false));
   };

   const onClear = () => {
      if (!cart.length) return;
      const previous = cart;
      dispatch(clearCart());
      setChargeError(null);
      toast("Cart cleared", {
         action: { label: "Undo", onClick: () => dispatch(setCart(previous)) },
      });
   };

   const onCharge = async () => {
      setChargeError(null);
      const tendered = parseFloat(String(amountTendered ?? "").replace(/,/g, "")) || 0;

      const parsed = posTransactionSchema.safeParse({ cart, paymentMethod, subtotal, total });
      if (!parsed.success) {
         setChargeError(parsed.error.issues[0]?.message ?? "Check the sale details and try again.");
         return;
      }

      // Same request body as before: the parsed sale (cart lines as id/quantity/isKit) plus payment fields.
      const payload = {
         ...parsed.data,
         invoiceNumber: String(invoiceNumber).trim().toUpperCase(),
         total: Number(total.toFixed(2)),
         amountTendered: tendered.toFixed(2),
         change: (tendered - total).toFixed(2),
         // Same key on a retry of this cart: the server hands back the recorded sale, no double charge
         clientRef,
      };

      setIsSubmitting(true);
      const result = await exec(checkoutOrder, payload);
      setIsSubmitting(false);

      if (!result.success) {
         setChargeError(result.message || "The sale wasn't recorded. Try again.");
         return;
      }

      // The receipt is printed from the order the server saved, so it matches the record exactly
      // (Fallback from the cart for a backend that doesn't return the order yet.)
      const order = result.result?.order ?? {
         order_number: result.result?.order_number,
         invoice_number: payload.invoiceNumber,
         order_total: payload.total,
         subtotal: payload.total,
         created_at: new Date().toISOString(),
         payments: {
            payment_method: payload.paymentMethod,
            amount_tendered: payload.amountTendered,
            change_given: payload.change,
         },
         items: cart.map((line) => ({
            kit_id: line.isKit ? line.id : null,
            product_id: line.isKit ? null : line.id,
            item_name: line.name,
            variant_name: line.isKit ? null : line.variant_option,
            unit_price: line.price,
            quantity: line.quantity,
         })),
      };
      if (result.result?.replayed) toast.info(result.message);
      printOrderReceipt(order);

      setCompleted({
         invoiceNumber: order.invoice_number || order.order_number,
         count: itemCount,
         total: Number(order.order_total),
         amountTendered: Number(order.payments?.amount_tendered),
         change: Number(order.payments?.change_given),
         order,
      });
      dispatch(resetCheckout());
      refetch();
   };

   const onDeduct = async () => {
      setIsSubmitting(true);
      const result = await exec(bulkDeduct, {
         cart,
         paymentMethod: "none",
         subtotal,
         total: 0,
         type: "deduction",
         remarks,
         invoiceNumber: `DDC-${Date.now()}`,
         amountTendered: 0,
         change: 0,
      });
      setIsSubmitting(false);

      if (!result.success) {
         toast.error(result.message || "The deduction wasn't recorded. Try again.");
         return;
      }

      toast.success(
         result.result?.message ||
            (deductionNeedsApproval ? "Deduction sent for approval" : `${itemCount} items removed from stock`),
      );
      dispatch(resetCheckout());
      refetch();
   };

   const categories = useMemo(() => categoryList ?? [], [categoryList]);

   const measureChips = useCallback((viewport) => {
      if (!viewport?.matches?.("[data-slot='scroll-area-viewport']")) return;
      const { scrollLeft, scrollWidth, clientWidth } = viewport;
      const next = { start: scrollLeft > 1, end: scrollLeft + clientWidth < scrollWidth - 1 };
      setChipOverflow((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
   }, []);

   // Re-measure when the categories arrive or the row is resized.
   useEffect(() => {
      const viewport = chipsRef.current?.querySelector("[data-slot='scroll-area-viewport']");
      if (!viewport) return;
      measureChips(viewport);
      const observer = new ResizeObserver(() => measureChips(viewport));
      observer.observe(viewport);
      if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
      return () => observer.disconnect();
   }, [categories, measureChips]);
   const showSkeleton = isLoading || (isFetching && !inventoryItems);

   return (
      <PageLayout route={POINT_OF_SALE}>
         <div className='flex w-full flex-col lg:min-h-screen lg:flex-row lg:items-stretch'>
            {/* Catalogue */}
            <section className='flex min-w-0 flex-1 flex-col gap-4 lg:py-7 lg:pr-7'>
               {/* Shift controls get their own strip up here, so the checkout panel keeps its height for the cart */}
               <ShiftStatus />

               <header className='flex flex-wrap items-center gap-3'>
                  <h1 className='mr-auto text-2xl font-bold tracking-tight text-foreground'>Sales</h1>
                  <label className='relative w-full sm:w-auto sm:min-w-80 sm:max-w-md sm:flex-1'>
                     <span className='sr-only'>Search items</span>
                     <SearchIcon className='pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-neutral-500' />
                     <input
                        ref={searchRef}
                        type='search'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={onSearchKeyDown}
                        placeholder='Search name or SKU'
                        autoComplete='off'
                        className='h-11 w-full rounded-md border border-neutral-300 bg-white pr-11 pl-10 text-sm lg:text-base text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_rgb(17_40_102/0.12)] [&::-webkit-search-cancel-button]:hidden'
                     />
                     {search ? (
                        <button
                           type='button'
                           aria-label='Clear search'
                           onClick={() => {
                              setSearch("");
                              searchRef.current?.focus();
                           }}
                           className='absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100'
                        >
                           <X className='size-4' />
                        </button>
                     ) : (
                        <kbd className='pointer-events-none absolute top-1/2 right-2.5 hidden h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded border border-neutral-300 bg-neutral-50 px-1.5 text-xs lg:text-sm font-semibold text-neutral-500 sm:flex'>
                           /
                        </kbd>
                     )}
                  </label>
               </header>

               <div ref={chipsRef} className='flex items-start justify-between gap-8'>
                  <ScrollArea
                     orientation='horizontal'
                     className='-mx-1 min-w-0 max-w-3xl flex-1'
                     onScrollCapture={(e) => measureChips(e.target)}
                     style={{
                        maskImage: `linear-gradient(to right, transparent 0, #000 ${chipOverflow.start ? "40px" : "0px"}, #000 calc(100% - ${chipOverflow.end ? "56px" : "0px"}), transparent 100%)`,
                     }}
                  >
                     <div className='flex w-max gap-1.5 px-1 pt-0.5 pb-3' role='group' aria-label='Category'>
                        <Chip active={!category} onClick={() => dispatch(setCategory(null))}>
                           All
                        </Chip>
                        {categoriesLoading &&
                           [72, 88, 120, 96, 104].map((w) => (
                              <Skeleton key={w} className='h-8 rounded-full' style={{ width: w }} aria-hidden='true' />
                           ))}
                        {categories.map((c) => (
                           <Chip
                              key={c.id}
                              active={String(category) === String(c.id)}
                              onClick={() => dispatch(setCategory(String(c.id)))}
                           >
                              {c.name}
                           </Chip>
                        ))}
                     </div>
                  </ScrollArea>
                  <ICheckbox
                     name='pos-include-low-stock'
                     label='Include low stock'
                     useForm={false}
                     checked={showLowStock}
                     onChange={(value) => dispatch(setShowLowStock(value === true))}
                     className='h-9 shrink-0'
                     labelClassName='text-sm font-medium text-neutral-700'
                  />
               </div>

               {showSkeleton ? (
                  <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
                     {Array.from({ length: 12 }).map((_, i) => (
                        <TileSkeleton key={i} />
                     ))}
                  </div>
               ) : inventoryItems?.length ? (
                  <div
                     className={cn(
                        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 transition-opacity duration-150",
                        isFetching && "opacity-60",
                     )}
                  >
                     {inventoryItems.map((item) => (
                        <PointOfSaleItem
                           key={`${item.isKit ? "kit" : "variant"}-${item.id}`}
                           {...item}
                           cartQty={cartQtyFor(item)}
                           onClick={() => addItemToCart(item)}
                        />
                     ))}
                  </div>
               ) : (
                  <div className='flex flex-col items-center gap-1 rounded-lg border border-dashed border-neutral-300 px-6 py-14 text-center'>
                     <p className='text-sm lg:text-base font-semibold text-foreground'>
                        {hasFilters ? "No items match these filters" : "No items with stock to sell"}
                     </p>
                     <p className='text-sm text-neutral-600'>
                        {hasFilters
                           ? "Try another search or category, or include low-stock items."
                           : "Items appear here once they have stock that hasn’t expired."}
                     </p>
                     {hasFilters && (
                        <button
                           type='button'
                           onClick={clearFilters}
                           className='mt-3 h-9 rounded-lg border border-neutral-300 bg-white px-4 text-sm lg:text-base font-semibold text-foreground hover:bg-neutral-100'
                        >
                           Clear filters
                        </button>
                     )}
                  </div>
               )}
            </section>

            {/* Current sale */}
            <aside
               aria-label='Current sale'
               className='mt-6 flex flex-col rounded-xl border border-neutral-200 bg-white lg:sticky lg:top-0 lg:mt-0 lg:h-screen lg:w-[400px] lg:shrink-0 lg:rounded-none lg:border-y-0 lg:border-r-0'
            >
               <div className='flex items-center gap-2.5 border-b border-neutral-100 px-6 py-4'>
                  <h2 className='text-base lg:text-lg font-bold tracking-[-0.01em] text-foreground'>Current sale</h2>
                  <span
                     className={cn(
                        "flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-2 text-xs lg:text-sm font-semibold tabular-nums",
                        itemCount ? "bg-primary text-white" : "bg-neutral-100 text-neutral-500",
                     )}
                     aria-label={itemCount === 1 ? "1 item" : `${itemCount} items`}
                  >
                     {itemCount}
                  </span>
                  <button
                     type='button'
                     onClick={onClear}
                     disabled={!cart.length || isSubmitting}
                     className='ml-auto flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-primary'
                  >
                     <Trash2 className='size-3.5' />
                     Clear
                  </button>
               </div>

               <div className='min-h-32 flex-1 overflow-y-auto px-6 [scrollbar-color:var(--color-neutral-300)_transparent] [scrollbar-width:thin]'>
                  {cart.length ? (
                     <ul>
                        {cart.map((item) => (
                           <CartItem
                              key={`${item.isKit ? "kit" : "variant"}-${item.id}`}
                              item={item}
                              disabled={isSubmitting}
                           />
                        ))}
                     </ul>
                  ) : (
                     !completed && (
                        <div className='flex flex-col items-center py-12 text-center'>
                           <span className='mb-3 flex size-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-400'>
                              <ShoppingBasket className='size-5' />
                           </span>
                           <p className='text-sm lg:text-base font-semibold text-foreground'>No items yet</p>
                           <p className='mt-1 text-sm text-neutral-600'>
                              Tap an item, or type its SKU and press Enter.
                           </p>
                        </div>
                     )
                  )}
               </div>

               <div className='border-t border-neutral-200 bg-neutral-50/70 px-6 pt-4 pb-5'>
                  {/* Sales need an open shift (opening cash); internal deductions don't touch the drawer */}
                  <ShiftGate>
                     {(openShiftForm) => (
                        <CheckoutPanel
                           tillClosed={openShiftForm}
                           itemCount={itemCount}
                           subtotal={subtotal}
                           total={total}
                           canDeduct={canDeduct}
                           deductionNeedsApproval={deductionNeedsApproval}
                           isSubmitting={isSubmitting}
                           completed={completed}
                           error={chargeError}
                           onCharge={onCharge}
                           onDeduct={onDeduct}
                           onPrintAgain={() => completed && printOrderReceipt(completed.order)}
                           onNewSale={() => {
                              setCompleted(null);
                              dispatch(resetCheckout());
                              searchRef.current?.focus();
                           }}
                        />
                     )}
                  </ShiftGate>
               </div>
            </aside>
         </div>
      </PageLayout>
   );
}

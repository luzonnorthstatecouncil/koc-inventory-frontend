import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SearchIcon, ShoppingBasket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import PageLayout from "@/layout/PageLayout";
import { POINT_OF_SALE } from "@/constants/routes";
import PointOfSaleItem from "@/components/custom/PointOfSaleItem";
import CartItem from "@/components/custom/CartItem";
import CheckoutPanel from "@/components/custom/CheckoutPanel";
import ICheckbox from "@/components/custom/Checkbox";
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
import { printInvoice } from "@/helpers/printInvoice";
import { cn } from "@/lib/utils";

const isTypingTarget = (el) =>
   el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

function Chip({ active, children, ...props }) {
   return (
      <button
         type='button'
         aria-pressed={active}
         className={cn(
            "h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
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
      <div className='flex min-h-[152px] flex-col rounded-xl border border-neutral-200 bg-white p-3.5' aria-hidden='true'>
         <div className='h-2.5 w-1/3 animate-pulse rounded bg-neutral-100' />
         <div className='mt-2.5 h-3.5 w-4/5 animate-pulse rounded bg-neutral-100' />
         <div className='mt-auto mb-3 flex items-end justify-between'>
            <div className='h-4.5 w-1/2 animate-pulse rounded bg-neutral-100' />
            <div className='size-7 animate-pulse rounded-lg bg-neutral-100' />
         </div>
         <div className='border-t border-neutral-100 pt-2.5'>
            <div className='h-3 w-1/3 animate-pulse rounded bg-neutral-100' />
         </div>
      </div>
   );
}

export default function POS() {
   const dispatch = useDispatch();
   const exec = useCatchQuery();
   const [checkoutOrder] = useCheckoutOrderMutation();
   const [bulkDeduct] = useBulkDeductStocksMutation();

   const { searchQuery, cart, category, paymentMethod, showLowStock, amountTendered, invoiceNumber, isDeduction, remarks } =
      useSelector((state) => state.cart);

   const role = useSelector((state) => state.user.user?.role);
   const canDeduct = role === "admin" || role === "supervisor";
   const deductionNeedsApproval = role === "supervisor";

   const [search, setSearch] = useState("");
   const debouncedSearch = useDebounce(search, 300);
   const searchRef = useRef(null);
   const pendingScanRef = useRef(null);

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

   const { data: categoryList } = useGetCategoryListQuery();

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

   // Barcode scanners type the code and press Enter. Run the search right away, then add
   // the item when the code matches one SKU exactly, or when only one item comes back.
   const onSearchKeyDown = (e) => {
      if (e.key === "Escape" && search) {
         setSearch("");
         return;
      }
      if (e.key !== "Enter") return;
      e.preventDefault();
      const code = search.trim();
      if (!code) return;
      pendingScanRef.current = code;
      dispatch(setSearchQuery(code));
   };

   useEffect(() => {
      const code = pendingScanRef.current;
      if (!code || isFetching || searchQuery !== code || !inventoryItems) return;
      pendingScanRef.current = null;

      const exact = inventoryItems.filter((i) => String(i.sku ?? "").toLowerCase() === code.toLowerCase());
      const match = exact.length === 1 ? exact[0] : inventoryItems.length === 1 ? inventoryItems[0] : null;

      if (match) {
         addItemToCart(match);
         setSearch("");
         dispatch(setSearchQuery(""));
      }
   }, [inventoryItems, isFetching, searchQuery, addItemToCart, dispatch]);

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
      };

      setIsSubmitting(true);
      const result = await exec(checkoutOrder, payload);
      setIsSubmitting(false);

      if (!result.success) {
         setChargeError(result.message || "The sale wasn't recorded. Try again.");
         return;
      }

      const invoiceInfo = {
         cart,
         paymentMethod: payload.paymentMethod,
         subtotal: payload.subtotal,
         total: payload.total,
         amountTendered: payload.amountTendered,
         change: payload.change,
      };
      const printedAt = new Date();
      const receiptId = payload.invoiceNumber || result.result?.id || `TXN-${Date.now()}`;
      printInvoice(invoiceInfo, receiptId, printedAt);

      setCompleted({
         invoiceNumber: receiptId,
         count: itemCount,
         total: payload.total,
         amountTendered: Number(payload.amountTendered),
         change: Number(payload.change),
         invoiceInfo,
         printedAt,
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
   const showSkeleton = isLoading || (isFetching && !inventoryItems);

   return (
      <PageLayout route={POINT_OF_SALE}>
         <div className='flex w-full flex-col lg:min-h-screen lg:flex-row lg:items-stretch'>
            {/* Catalogue */}
            <section className='flex min-w-0 flex-1 flex-col gap-4 lg:py-7 lg:pr-7'>
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
                        placeholder='Search name, SKU or scan a barcode'
                        autoComplete='off'
                        className='h-11 w-full rounded-md border border-neutral-300 bg-white pr-11 pl-10 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_rgb(17_40_102/0.12)] [&::-webkit-search-cancel-button]:hidden'
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
                        <kbd className='pointer-events-none absolute top-1/2 right-2.5 hidden h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded border border-neutral-300 bg-neutral-50 px-1.5 text-xs font-semibold text-neutral-500 sm:flex'>
                           /
                        </kbd>
                     )}
                  </label>
               </header>

               <div className='flex items-center gap-3'>
                  <div className='-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-0.5' role='group' aria-label='Category'>
                     <Chip active={!category} onClick={() => dispatch(setCategory(null))}>
                        All
                     </Chip>
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
                  <ICheckbox
                     name='pos-include-low-stock'
                     label='Include low stock'
                     useForm={false}
                     checked={showLowStock}
                     onChange={(value) => dispatch(setShowLowStock(value === true))}
                     className='shrink-0'
                     labelClassName='text-[13px] font-medium text-neutral-700'
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
                     <p className='text-[15px] font-semibold text-foreground'>
                        {hasFilters ? "No items match these filters" : "No items with stock to sell"}
                     </p>
                     <p className='text-[13px] text-neutral-600'>
                        {hasFilters
                           ? "Try another search or category, or include low-stock items."
                           : "Items appear here once they have stock that hasn’t expired."}
                     </p>
                     {hasFilters && (
                        <button
                           type='button'
                           onClick={clearFilters}
                           className='mt-3 h-9 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-foreground hover:bg-neutral-100'
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
                  <h2 className='text-[17px] font-bold tracking-[-0.01em] text-foreground'>Current sale</h2>
                  <span
                     className={cn(
                        "flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums",
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
                     className='ml-auto flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-semibold text-neutral-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-primary'
                  >
                     <Trash2 className='size-3.5' />
                     Clear
                  </button>
               </div>

               <div className='min-h-32 flex-1 overflow-y-auto px-6 [scrollbar-color:var(--color-neutral-300)_transparent] [scrollbar-width:thin]'>
                  {cart.length ? (
                     <ul>
                        {cart.map((item) => (
                           <CartItem key={`${item.isKit ? "kit" : "variant"}-${item.id}`} item={item} disabled={isSubmitting} />
                        ))}
                     </ul>
                  ) : (
                     !completed && (
                        <div className='flex flex-col items-center py-12 text-center'>
                           <span className='mb-3 flex size-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-400'>
                              <ShoppingBasket className='size-5' />
                           </span>
                           <p className='text-[15px] font-semibold text-foreground'>No items yet</p>
                           <p className='mt-1 text-[13px] text-neutral-600'>Tap an item, or type its SKU and press Enter.</p>
                        </div>
                     )
                  )}
               </div>

               <div className='border-t border-neutral-200 bg-neutral-50/70 px-6 pt-5 pb-6'>
                  <CheckoutPanel
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
                     onPrintAgain={() =>
                        completed && printInvoice(completed.invoiceInfo, completed.invoiceNumber, completed.printedAt)
                     }
                     onNewSale={() => {
                        setCompleted(null);
                        dispatch(resetCheckout());
                        searchRef.current?.focus();
                     }}
                  />
               </div>
            </aside>
         </div>
      </PageLayout>
   );
}

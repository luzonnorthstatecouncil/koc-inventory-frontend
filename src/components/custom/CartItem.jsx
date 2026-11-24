import { Minus, Plus, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { removeFromCart, updateCart } from "@/features/slice/cartSlice";
import { priceParser } from "@/helpers/parser";
import { splitItemName } from "./PointOfSaleItem";

const stepClass =
   "flex h-full w-8 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary";

export default function CartItem({ item, disabled = false }) {
   const dispatch = useDispatch();
   const lineKey = { id: item.id, isKit: item.isKit };
   const atStockLimit = typeof item.current_qty === "number" && item.quantity >= item.current_qty;
   const { title, variant } = splitItemName(item.name);
   const removes = item.quantity <= 1;

   const decrease = () => {
      if (removes) {
         dispatch(removeFromCart(lineKey));
         return;
      }
      dispatch(updateCart({ ...lineKey, data: { ...item, quantity: item.quantity - 1 } }));
   };

   const increase = () => {
      if (atStockLimit) return;
      dispatch(updateCart({ ...lineKey, data: { ...item, quantity: item.quantity + 1 } }));
   };

   return (
      <li className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 border-b border-neutral-100 py-3.5 last:border-b-0'>
         <div className='min-w-0'>
            <p className='truncate text-[14px] leading-5 font-semibold text-foreground'>{title}</p>
            <p className='truncate text-xs leading-4 tabular-nums text-neutral-500'>
               {variant ? `${variant} · ` : ""}
               {priceParser(item.price)} each
            </p>
         </div>
         <p className='text-right text-[14px] font-semibold tabular-nums text-foreground'>
            {priceParser(item.price * item.quantity)}
         </p>

         <div className='flex items-center gap-2'>
            <div className='flex h-8 items-stretch overflow-hidden rounded-lg border border-neutral-200 bg-white'>
               <button
                  type='button'
                  className={stepClass}
                  onClick={decrease}
                  disabled={disabled}
                  aria-label={removes ? `Remove ${item.name}` : `One less ${item.name}`}
               >
                  {removes ? (
                     <Trash2 className='size-3.5' strokeWidth={2} />
                  ) : (
                     <Minus className='size-3.5' strokeWidth={2.25} />
                  )}
               </button>
               <span
                  className='flex w-8 items-center justify-center border-x border-neutral-200 text-[13px] font-semibold tabular-nums text-foreground'
                  aria-live='polite'
               >
                  {item.quantity}
               </span>
               <button
                  type='button'
                  className={stepClass}
                  onClick={increase}
                  disabled={disabled || atStockLimit}
                  aria-label={`One more ${item.name}`}
                  title={atStockLimit ? "No more in stock" : undefined}
               >
                  <Plus className='size-3.5' strokeWidth={2.25} />
               </button>
            </div>
            {atStockLimit && <span className='text-[11px] font-semibold text-amber-700'>Max stock</span>}
         </div>
      </li>
   );
}

import { Minus, Plus, Trash2Icon } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { removeFromCart, updateCart } from "@/features/slice/cartSlice";
import { priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";

export default function CartItem({ item }) {
   const dispatch = useDispatch();
   const lineKey = { id: item.id, isKit: item.isKit };
   const atStockLimit = typeof item.current_qty === "number" && item.quantity >= item.current_qty;

   const handleQuantity = (isRemove) => {
      if (isRemove && item.quantity === 1) {
         dispatch(removeFromCart(lineKey));
         return;
      }

      if (!isRemove && atStockLimit) {
         toast.error("Cannot add more items than available in stock");
         return;
      }

      dispatch(
         updateCart({
            ...lineKey,
            data: { ...item, quantity: isRemove ? item.quantity - 1 : item.quantity + 1 },
         }),
      );
   };

   const handleRemove = () => dispatch(removeFromCart(lineKey));
   const lineTotal = priceParser(item.price * item.quantity);

   return (
      <div className='group relative select-none w-full rounded-xl bg-white border border-gray-200 hover:border-emphasis/50 hover:shadow-sm transition-all duration-200 overflow-hidden'>
         <div className='pl-4 pr-3 py-2.5 flex items-center gap-3'>
            <div className='flex-1 min-w-0'>
               <p className='text-base font-bold text-foreground leading-snug line-clamp-2'>{item.name}</p>
               <p className='text-sm text-muted-foreground mt-0.5'>{priceParser(item.price)} each</p>
            </div>

            <p className='flex-shrink-0 text-base font-bold text-emphasis tabular-nums'>{lineTotal}</p>
         </div>

         <div className='flex items-center justify-between px-4 pb-2.5 gap-2'>
            <div className='flex items-center gap-1'>
               <button
                  onClick={() => handleQuantity(true)}
                  className={cn(
                     "size-6 rounded-md flex items-center justify-center transition-colors",
                     item.quantity === 1
                        ? "bg-red-100 hover:bg-red-200 text-red-500"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600",
                  )}
               >
                  {item.quantity === 1 ? <Trash2Icon className='size-3' /> : <Minus className='size-3' />}
               </button>

               <span className='text-sm font-bold text-foreground tabular-nums w-5 text-center'>{item.quantity}</span>

               <button
                  onClick={() => handleQuantity(false)}
                  className={cn(
                     "size-6 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center transition-colors",
                     atStockLimit ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-200",
                  )}
               >
                  <Plus className='size-3' />
               </button>
            </div>

            <button
               onClick={handleRemove}
               className='text-xs text-muted-foreground hover:text-red-500 transition-colors font-medium'
            >
               Remove
            </button>
         </div>
      </div>
   );
}

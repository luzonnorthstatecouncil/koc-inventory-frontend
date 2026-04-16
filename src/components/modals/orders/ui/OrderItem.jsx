import { priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";

export default function OrderItem({ name, quantity, price, className, nameClassName, priceClassName, parsePrice = true }) {
   return (
      <div className={cn("flex items-center justify-between gap-3 py-1.5", className)}>
         <div className='flex items-center gap-2.5 min-w-0'>
            {quantity && (
               <span className='flex-shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md bg-primary/10 text-primary font-bold text-xs font-mono'>
                  ×{quantity}
               </span>
            )}
            <div className={cn("min-w-0", nameClassName)}>
               <p className='text-sm font-medium text-foreground truncate'>{name}</p>
               {quantity && (
                  <p className='text-sm text-muted-foreground'>{priceParser(price)} each</p>
               )}
            </div>
         </div>
         <p className={cn("text-sm font-semibold text-foreground tabular-nums flex-shrink-0", priceClassName)}>
            {parsePrice ? priceParser(quantity ? quantity * price : price) : price}
         </p>
      </div>
   );
}

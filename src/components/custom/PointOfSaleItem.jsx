import { CheckCircle2, ShoppingCart } from "lucide-react";
import IButton from "./Button";
import { useMemo } from "react";
import { priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import IPopover from "@/components/custom/Popover";

function StockPill({ current, reorder, safe }) {
   const { label, bar, text, bg } = useMemo(() => {
      if (current <= 0) return { label: "Out of stock", bar: "bg-gray-300", text: "text-gray-500", bg: "bg-gray-50" };
      if (current < reorder) return { label: "Critical", bar: "bg-red-500", text: "text-red-600", bg: "bg-red-50" };
      if (current < safe) return { label: "Low", bar: "bg-orange-400", text: "text-orange-600", bg: "bg-orange-50" };
      return { label: "In stock", bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
   }, [current, reorder, safe]);

   return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full", bg, text)}>
         <span className={cn("size-1.5 rounded-full flex-shrink-0", bar)} />
         {current} · {label}
      </span>
   );
}

export default function PointOfSaleItem(props) {
   const outOfStock = props.current_qty <= 0;

   return (
      <div
         onClick={!outOfStock ? props.onClick : undefined}
         onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
               e.preventDefault();
               if (!outOfStock && props.onClick) props.onClick(e);
            }
         }}
         role="button"
         tabIndex={0}
         className={cn(
            "group relative w-full md:w-55 lg:w-57 text-left rounded-xl border bg-white transition-all duration-200 overflow-hidden",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            props.included
               ? "border-primary ring-2 ring-primary/30 shadow-md"
               : outOfStock
               ? "opacity-50 cursor-not-allowed border-gray-200"
               : "hover:shadow-md hover:border-primary/40 border-gray-200 cursor-pointer",
         )}
      >
         <div className='p-3'>
            {/* Badges */}
            <div className='absolute top-2 right-2 flex gap-1 z-10'>
               {props.isKit && (
                  <IPopover
                     align="end"
                     sideOffset={8}
                     className="w-64 p-3"
                     trigger={
                        <span 
                           onClick={(e) => e.stopPropagation()}
                           className='px-1.5 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-bold rounded uppercase tracking-tighter cursor-pointer transition-colors'
                        >
                           Kit
                        </span>
                     }
                  >
                     <div className="space-y-2">
                        <p className="font-semibold text-sm leading-none text-foreground">Kit Components</p>
                        <div className="flex flex-col gap-1.5 mt-2 max-h-48 overflow-y-auto pr-1">
                           {props.items && props.items.length > 0 ? (
                              props.items.map((item) => {
                                 const variantName = item.variant?.variant_name;
                                 const isDefault = !variantName || variantName === "Default";
                                 return (
                                    <div key={item.id} className="flex justify-between items-start gap-2 text-xs text-muted-foreground border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
                                       <span className="flex-1 leading-snug">
                                          <span className="font-medium text-foreground">{item.variant?.inventory?.name || "Unknown"}</span>
                                          {!isDefault && <span className="text-[10px] ml-1">({variantName})</span>}
                                       </span>
                                       <span className="font-medium bg-muted px-1.5 rounded-md whitespace-nowrap">x{item.quantity}</span>
                                    </div>
                                 );
                              })
                           ) : (
                              <span className="text-xs italic text-muted-foreground">No items included.</span>
                           )}
                        </div>
                     </div>
                  </IPopover>
               )}
               {props.included && (
                  <CheckCircle2 className='size-4 text-primary fill-primary/10' />
               )}
            </div>

            {/* Name & SKU */}
            <p className='text-sm font-bold text-foreground leading-snug line-clamp-2 pr-5 mb-1'>{props.name}</p>
            {props.sku && (
               <p className='text-xs text-muted-foreground font-mono tracking-wide mb-2'>{props.sku}</p>
            )}

            {/* Price */}
            <p className={cn("text-lg font-extrabold tabular-nums leading-none mb-3", props.included ? "text-primary" : "text-foreground")}>
               {priceParser(props.price)}
            </p>

            {/* Footer: stock pill + add button */}
            <div className='flex items-center justify-between gap-2'>
               <StockPill
                  current={props.current_qty}
                  reorder={props.reorder_level}
                  safe={props.safe_qty_level}
               />
               <div
                  className={cn(
                     "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors",
                     props.included
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 text-gray-600 group-hover:bg-primary group-hover:text-primary-foreground",
                  )}
               >
                  <ShoppingCart className='size-3' />
                  {props.included ? "Added" : "Add"}
               </div>
            </div>
         </div>
      </div>
   );
}


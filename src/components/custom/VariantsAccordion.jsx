import { cn } from "@/lib/utils";
import { stockState } from "./PointOfSaleItem";
import { AddStockLink } from "./RestockLinks";
import { needsRestock } from "@/helpers/restock";

const TONE = {
   ok: { dot: "bg-neutral-300", text: "text-neutral-500", label: "In stock" },
   low: { dot: "bg-amber-500", text: "text-amber-700", label: "Low" },
   critical: { dot: "bg-red-500", text: "text-red-700", label: "Reorder" },
   out: { dot: "bg-red-500", text: "text-red-700", label: "Out of stock" },
};

/**
 * The variants of one product, shown in the Items table's expanded row.
 * Same text and stock wording as the table above it.
 */
const VariantsAccordion = ({ variants = [], className }) => {
   if (!variants || variants.length === 0) {
      return <p className='py-1 text-sm text-neutral-500'>No variants for this product.</p>;
   }

   return (
      <div className={cn("flex flex-col gap-2", className)}>
         <p className='text-xs font-semibold text-neutral-500'>
            {variants.length} {variants.length === 1 ? "variant" : "variants"}
         </p>

         <ul className='grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
            {variants.map((variant, index) => {
               const qty = Number(variant.current_qty) || 0;
               const tone = TONE[stockState(qty, variant.reorder_level, variant.safe_qty_level).tone];
               return (
                  <li
                     key={variant.id ?? index}
                     className='flex flex-col gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2.5'
                  >
                     <div className='flex items-center justify-between gap-3'>
                        <div className='min-w-0'>
                           <p className='truncate text-sm font-medium text-foreground'>{variant.variant_name}</p>
                           <p className={cn("inline-flex items-center gap-1.5 text-xs", tone.text)}>
                              <span className={cn("size-1.5 rounded-full", tone.dot)} aria-hidden='true' />
                              {tone.label}
                           </p>
                        </div>
                        <p className='shrink-0 text-sm font-medium text-foreground tabular-nums'>
                           {qty.toLocaleString()} <span className='font-medium text-neutral-500'>{qty === 1 ? "unit" : "units"}</span>
                        </p>
                     </div>
                     {/* Only variants below their safe level get the shortcut */}
                     {needsRestock(variant) && <AddStockLink variant={variant} className='-ml-1.5 self-start' />}
                  </li>
               );
            })}
         </ul>
      </div>
   );
};

export default VariantsAccordion;

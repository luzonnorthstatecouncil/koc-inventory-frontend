import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { stockState } from "@/components/custom/PointOfSaleItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Only actionable states get a line; a healthy variant shows just its count.
const WARNING = {
   low: { label: "Low stock", dot: "bg-amber-500", text: "text-amber-700" },
   critical: { label: "Reorder now", dot: "bg-red-500", text: "text-red-700" },
   out: { label: "Out of stock", dot: "bg-red-500", text: "text-red-700" },
};

function VariantRow({ variant }) {
   const qty = Number(variant.current_qty) || 0;
   const warning = WARNING[stockState(qty, variant.reorder_level, variant.safe_qty_level).tone];

   return (
      <li className='flex flex-col gap-2 px-4 py-3'>
         <div className='flex items-start justify-between gap-4'>
            <div className='flex min-w-0 flex-col gap-0.5'>
               <p className='truncate text-sm font-medium text-foreground'>{variant.variant_name}</p>
               {variant.sku && <p className='truncate text-xs text-neutral-500 tabular-nums'>{variant.sku}</p>}
            </div>
            <div className='flex shrink-0 flex-col items-end gap-0.5'>
               <p className='text-sm font-medium text-foreground tabular-nums'>
                  {qty.toLocaleString()} <span className='font-medium text-neutral-500'>{qty === 1 ? "unit" : "units"}</span>
               </p>
               {warning && (
                  <p className={cn("inline-flex items-center gap-1.5 text-xs", warning.text)}>
                     <span className={cn("size-1.5 rounded-full", warning.dot)} aria-hidden='true' />
                     {warning.label}
                  </p>
               )}
            </div>
         </div>
         <dl className='flex gap-4 text-xs text-neutral-500 tabular-nums'>
            {[
               ["Reorder", variant.reorder_level],
               ["Safe", variant.safe_qty_level],
               ["Max", variant.max_qty_level],
            ].map(([label, value]) => (
               <div key={label} className='flex gap-1'>
                  <dt>{label}</dt>
                  <dd className='font-medium text-neutral-700'>{value ?? 0}</dd>
               </div>
            ))}
         </dl>
      </li>
   );
}

export default function ViewVariants({ variants }) {
   return (
      <div className='w-full'>
         <Title>Variants</Title>
         <Paragraph className='mb-4 w-3/4'>
            View the different variants of this inventory item. Each variant may have its own stock levels and quantity.
         </Paragraph>

         <ScrollArea className='h-70'>
            {variants && variants.length > 0 ? (
               <ul className='divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white'>
                  {variants.map((variant) => (
                     <VariantRow key={variant.id} variant={variant} />
                  ))}
               </ul>
            ) : (
               <p className='py-2 text-sm text-neutral-500'>No variants available</p>
            )}
         </ScrollArea>
      </div>
   );
}

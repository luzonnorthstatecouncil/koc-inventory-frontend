import Details from "./Details";
import { Package, Hash, TrendingDown, Shield, TrendingUp } from "lucide-react";

export default function VariantItem({ variant }) {
   return (
      <div className='group p-4 border-l-4 border-l-primary/40 border border-gray-200 rounded-lg bg-gradient-to-br from-white to-gray-50/30 hover:shadow-md hover:border-primary/60 transition-all duration-200 mb-2'>
         <div className='flex items-start justify-between mb-3'>
            <div className='flex items-center gap-2'>
               <Package className='size-5 text-primary/70' />
               <div className='text-base font-semibold text-foreground group-hover:text-primary transition-colors'>
                  {variant.variant_name}
               </div>
            </div>
         </div>

         {variant.sku && (
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-4 pb-3 border-b border-gray-100'>
               <Hash className='size-3.5' />
               <span>SKU: {variant.sku}</span>
            </div>
         )}

         <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            <div className='flex items-start gap-2'>
               <TrendingUp className='size-4 text-green-600 mt-0.5 flex-shrink-0' />
               <Details label='Current Stock' description={variant.current_qty} />
            </div>
            <div className='flex items-start gap-2'>
               <TrendingDown className='size-4 text-orange-600 mt-0.5 flex-shrink-0' />
               <Details label='Reorder Level' description={variant.reorder_level} />
            </div>
            <div className='flex items-start gap-2'>
               <Shield className='size-4 text-blue-600 mt-0.5 flex-shrink-0' />
               <Details label='Safe Level' description={variant.safe_qty_level} />
            </div>
            <div className='flex items-start gap-2'>
               <TrendingUp className='size-4 text-purple-600 mt-0.5 flex-shrink-0' />
               <Details label='Max Level' description={variant.max_qty_level} />
            </div>
         </div>
      </div>
   );
}

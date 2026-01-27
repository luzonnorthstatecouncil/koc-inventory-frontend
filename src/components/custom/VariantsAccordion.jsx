import React from "react";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import IProgress from "./Progress";
import Title from "./Title";

/**
 * VariantsAccordion Component
 *
 * Displays a list of product variants with their stock information
 * Designed to be used within the DataTable's expandable row feature
 *
 * @param {Array} variants - Array of variant objects with name and stock properties
 * @param {string} className - Additional CSS classes
 */
const VariantsAccordion = ({ variants = [], className }) => {
   if (!variants || variants.length === 0) {
      return <div className='text-sm text-muted-foreground py-2'>No variants available</div>;
   }

   return (
      <div className={cn("space-y-2", className)}>
         <div className='text-sm font-semibold text-foreground mb-3 flex items-center gap-2'>
            <Package className='size-4' />
            Variants ({variants.length})
         </div>

         <div className='grid grid-cols-2 lg:grid-cols-5 gap-3'>
            {variants.map((variant, index) => {
               const variantColor =
                  variant.current_qty <= variant.reorder_level
                     ? "danger"
                     : variant.current_qty >= variant.safe_qty_level
                     ? "success"
                     : "default";

               const textColor =
                  variant.current_qty <= variant.reorder_level
                     ? "text-red-600"
                     : variant.current_qty >= variant.safe_qty_level
                     ? "text-green-600"
                     : "text-foreground";

               return (
                  <section className='p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow'>
                     <div key={index} className='flex items-center justify-between mb-2'>
                        <Title size='sm' className='font-medium line-clamp-2'>
                           {variant.variant_name}
                        </Title>

                        <div className='ml-3 flex flex-col items-end'>
                           <div className={cn("text-sm font-semibold", textColor)}>{variant.current_qty || 0}</div>
                           <div className='text-xs text-muted-foreground'>
                              {variant.current_qty > 1 ? "units" : "unit"}
                           </div>
                        </div>
                     </div>
                     <IProgress
                        value={variant.current_qty}
                        max={variant.max_qty_level}
                        variant={variantColor}
                        size='xs'
                     />
                  </section>
               );
            })}
         </div>
      </div>
   );
};

export default VariantsAccordion;

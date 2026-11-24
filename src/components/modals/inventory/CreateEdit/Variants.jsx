import { useFormContext, useFieldArray } from "react-hook-form";
import IInput from "@/components/custom/Input";
import Paragraph from "@/components/custom/Paragraph";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createItemVariantDefaultValues } from "@/lib/zod/schema/createItem";
import { useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import InputNumber from "@/components/custom/InputNumber";

export default function ItemVariants({ isCreate = true }) {
   const { control } = useFormContext();
   const { fields, append, remove } = useFieldArray({ control, name: "variants" });

   const handleAppend = useCallback(() => {
      if (fields.length >= 10) {
         toast.error("You can only add up to 10 variants.");
         return;
      }

      append(createItemVariantDefaultValues);
   }, [append, fields.length]);

   return (
      <section className='space-y-2'>
         <header className='flex items-center justify-between gap-4'>
            <Paragraph size='sm'>
               {fields.length} Variant{fields.length === 1 ? "" : "s"}
            </Paragraph>
            {/* A real button (via asChild) so it is keyboard-focusable; it was a clickable <span> */}
            <Badge asChild variant='default' className='text-xs p-2 h-7 rounded-md cursor-pointer select-none active:scale-98'>
               <button type='button' onClick={handleAppend}>
                  Add Variant
               </button>
            </Badge>
         </header>

         <ScrollArea className='h-60'>
            <div className='min-w-full divide-y space-y-2'>
               {fields.map((field, index) => {
                  return (
                     <div key={field.id} className='p-3 space-y-2 relative border rounded-md'>
                        <IInput
                           name={`variants.${index}.variant_name`}
                           label='Variant Name'
                           wrapperClassName='w-full'
                           placeholder='e.g., Small, Medium, Large, Red, Blue'
                        />
                        <section className='flex items-start justify-between gap-2'>
                           <InputNumber
                              requireMax={false}
                              name={`variants.${index}.reorder_level`}
                              label='Reorder Level'
                              inputClassName='w-full'
                              inputWrapperClassName='w-full'
                              inputContainerClassName='w-full'
                           />
                           <InputNumber
                              requireMax={false}
                              name={`variants.${index}.safe_qty_level`}
                              label='Safe Qty Level'
                              inputClassName='w-full'
                              inputWrapperClassName='w-full'
                              inputContainerClassName='w-full'
                           />
                           <InputNumber
                              requireMax={false}
                              name={`variants.${index}.max_qty_level`}
                              label='Max Qty Level'
                              inputClassName='w-full'
                              inputWrapperClassName='w-full'
                              inputContainerClassName='w-full'
                           />
                        </section>
                        {fields.length > 1 && (
                           <span
                              onClick={() => remove(index)}
                              className='flex items-center gap-1 text-sm text-destructive font-medium cursor-pointer mr-1 select-none'
                           >
                              Remove <Trash2 className='size-4 text-destructive' />
                           </span>
                        )}
                     </div>
                  );
               })}
            </div>
         </ScrollArea>
      </section>
   );
}

import { useFormContext, useFieldArray } from "react-hook-form";
import Paragraph from "@/components/custom/Paragraph";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCallback } from "react";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import InputNumber from "@/components/custom/InputNumber";
import IInput from "@/components/custom/Input";
import SelectAsync from "@/components/custom/SelectAsync";
import { useGetInventoryAsOptionsPaginatedQuery } from "@/features/api/inventory";

export default function KitItems() {
   const { control } = useFormContext();
   const { fields, append, remove } = useFieldArray({ control, name: "items" });

   const handleAppend = useCallback(() => {
      if (fields.length >= 20) {
         toast.error("You can only add up to 20 items in a kit.");
         return;
      }

      append({ variant_id: "", quantity: 1 });
   }, [append, fields.length]);

   return (
      <section className='space-y-4'>
         <IInput
            name='locked_qty'
            label='Reserved/Locked Quantity'
            type='number'
            placeholder='0'
            description='The number of kits to pre-assemble. This will reserve component stock immediately.'
            wrapperClassName='mt-3'
            className='w-30'
         />

         <header className='flex items-center justify-between gap-4'>
            <div>
               <h3 className='text-sm font-semibold text-foreground'>Kit Components</h3>
               <Paragraph size='xs' className='text-muted-foreground'>
                  Select items and specify quantities for this bundle.
               </Paragraph>
            </div>
            <Badge
               variant='default'
               className='text-xs px-3 h-8 rounded-md cursor-pointer select-none active:scale-95 flex gap-1.5 items-center'
               onClick={handleAppend}
            >
               <Plus className='size-3.5' />
               Add Item
            </Badge>
         </header>

         <ScrollArea className='h-[350px]'>
            <div className='space-y-3'>
               {fields.map((field, index) => {
                  return (
                     <div
                        key={field.id}
                        className='group relative flex flex-col sm:flex-row gap-3 p-4 border rounded-xl bg-card hover:bg-accent/5 transition-colors'
                     >
                        <div className='flex-1'>
                           <SelectAsync
                              name={`items.${index}.variant_id`}
                              label='Kit Item'
                              description='Select an item from the inventory to add to the kit.'
                              placeholder='Search for an item...'
                              searchable={true}
                              query={{
                                 useQuery: useGetInventoryAsOptionsPaginatedQuery,
                              }}
                           />
                        </div>
                        <div className='w-full sm:w-32'>
                           <InputNumber
                              requireMax={false}
                              name={`items.${index}.quantity`}
                              label='Quantity'
                              inputClassName='w-full'
                              inputWrapperClassName='w-full'
                              inputContainerClassName='w-full'
                           />
                        </div>

                        {fields.length > 1 && (
                           <button
                              type='button'
                              onClick={() => remove(index)}
                              className='absolute right-2 top-2 size-6 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity active:scale-90 z-10'
                           >
                              <Trash2 className='size-4 text-white' />
                           </button>
                        )}
                     </div>
                  );
               })}
            </div>
         </ScrollArea>

         {fields.length === 0 && (
            <div className='flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl bg-muted/30'>
               <Paragraph className='text-muted-foreground'>
                  No items added to this kit yet.
               </Paragraph>
               <button
                  type='button'
                  onClick={handleAppend}
                  className='mt-2 text-sm font-semibold text-primary hover:underline'
               >
                  Add your first item
               </button>
            </div>
         )}
      </section>
   );
}

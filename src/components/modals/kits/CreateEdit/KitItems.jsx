import { useFormContext, useFieldArray, useFormState, useWatch } from "react-hook-form";
import { useCallback } from "react";
import { Plus, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import IInput from "@/components/custom/Input";
import SelectAsync from "@/components/custom/SelectAsync";
import { useGetInventoryAsOptionsPaginatedQuery } from "@/features/api/inventory";
import { cn } from "@/lib/utils";

const MAX_COMPONENTS = 20;
// One row per component: item, quantity per kit, remove.
const ROW = "grid grid-cols-[minmax(0,1fr)_5rem_2rem] items-start gap-2";

function ComponentRow({ index, canRemove, onRemove }) {
   const { errors } = useFormState({ name: `items.${index}.quantity` });
   const savedLabel = useWatch({ name: `items.${index}.label` });
   const qtyError = errors?.items?.[index]?.quantity?.message;

   return (
      <li className='flex flex-col gap-1 py-1.5'>
         <div className={ROW}>
            <SelectAsync
               name={`items.${index}.variant_id`}
               placeholder='Search for an item...'
               fallbackLabel={savedLabel}
               searchable
               query={{ useQuery: useGetInventoryAsOptionsPaginatedQuery }}
            />
            <div className={cn(qtyError && "[&_input]:border-red-500")}>
               <IInput
                  name={`items.${index}.quantity`}
                  type='number'
                  min={1}
                  aria-label={`Component ${index + 1} quantity per kit`}
                  showError={false}
                  className='!px-1.5 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
               />
            </div>
            {canRemove ? (
               <button
                  type='button'
                  onClick={onRemove}
                  aria-label={`Remove component ${index + 1}`}
                  title='Remove component'
                  className='mt-0.5 flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-700'
               >
                  <X className='size-4' aria-hidden='true' />
               </button>
            ) : (
               <span aria-hidden='true' />
            )}
         </div>
         {qtyError && <p className='text-xs text-red-600'>{qtyError}</p>}
      </li>
   );
}

export default function KitItems({ scrollClassName }) {
   const { control } = useFormContext();
   const { fields, append, remove } = useFieldArray({ control, name: "items" });
   const { errors } = useFormState({ name: "items" });
   // "At least one item" is an array-level error, separate from the per-row ones
   const listError = errors?.items?.message || errors?.items?.root?.message;

   const handleAppend = useCallback(() => {
      if (fields.length >= MAX_COMPONENTS) return;
      append({ variant_id: "", quantity: 1 });
   }, [append, fields.length]);

   const atLimit = fields.length >= MAX_COMPONENTS;

   return (
      <section className='flex min-h-0 flex-col gap-3'>
         <header>
            <h3 className='text-sm font-semibold text-foreground'>
               Components <span className='font-medium text-neutral-500'>· {fields.length}</span>
            </h3>
            <p className='text-xs text-neutral-500'>The items that make up one kit, and how many of each.</p>
         </header>

         <div className='flex min-h-0 flex-col'>
            <div className={cn(ROW, "border-b border-neutral-200 pb-1.5 text-xs font-semibold text-neutral-500")}>
               <span>Item</span>
               <span className='text-center'>Per kit</span>
               <span />
            </div>

            <ScrollArea className={cn("max-h-[50vh] [&_[data-slot=scroll-area-viewport]>div]:!block", scrollClassName)}>
               <ol className='flex flex-col divide-y divide-neutral-100 pr-1'>
                  {fields.map((field, index) => (
                     <ComponentRow key={field.id} index={index} canRemove={fields.length > 1} onRemove={() => remove(index)} />
                  ))}
               </ol>
            </ScrollArea>

            {listError && <p className='mt-1 text-xs text-red-600'>{listError}</p>}

            <button
               type='button'
               onClick={handleAppend}
               disabled={atLimit}
               className='mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-foreground disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            >
               <Plus className='size-4' aria-hidden='true' />
               {atLimit ? `Limit of ${MAX_COMPONENTS} components reached` : "Add component"}
            </button>
         </div>
      </section>
   );
}

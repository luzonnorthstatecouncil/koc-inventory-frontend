import { useFormContext, useFieldArray, useFormState } from "react-hook-form";
import IInput from "@/components/custom/Input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createItemVariantDefaultValues } from "@/lib/zod/schema/createItem";
import { useCallback, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_VARIANTS = 10;

const LEVELS = [
   { key: "reorder_level", label: "Reorder" },
   { key: "safe_qty_level", label: "Safe" },
   { key: "max_qty_level", label: "Max" },
];

// One row per variant: name, three levels, remove.
const ROW = "grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.5rem_2rem] items-center gap-2";

function VariantRow({ index, canRemove, onRemove }) {
   const { errors } = useFormState({ name: `variants.${index}` });
   const rowErrors = errors?.variants?.[index] ?? {};
   // One message under the row instead of long text squeezed into the narrow number fields.
   const message = ["variant_name", ...LEVELS.map((l) => l.key)].map((k) => rowErrors[k]?.message).find(Boolean);

   return (
      <li className='flex flex-col gap-1 py-1.5'>
         <div className={ROW}>
            <div className={cn(rowErrors.variant_name && "[&_input]:border-red-500")}>
               <IInput
                  name={`variants.${index}.variant_name`}
                  placeholder='e.g. Default, Small, Red'
                  aria-label={`Variant ${index + 1} name`}
                  showError={false}
               />
            </div>
            {LEVELS.map(({ key, label }) => (
               <div key={key} className={cn(rowErrors[key] && "[&_input]:border-red-500")}>
                  <IInput
                     name={`variants.${index}.${key}`}
                     type='number'
                     min={0}
                     aria-label={`Variant ${index + 1} ${label.toLowerCase()} level`}
                     showError={false}
                     className='!px-1.5 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                  />
               </div>
            ))}
            {canRemove ? (
               <button
                  type='button'
                  onClick={onRemove}
                  aria-label={`Remove variant ${index + 1}`}
                  title='Remove variant'
                  className='flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-700'
               >
                  <X className='size-4' aria-hidden='true' />
               </button>
            ) : (
               <span aria-hidden='true' />
            )}
         </div>
         {message && <p className='text-xs text-red-600'>{message}</p>}
      </li>
   );
}

export default function ItemVariants({ scrollClassName }) {
   const { control, setFocus } = useFormContext();
   const { fields, append, remove } = useFieldArray({ control, name: "variants" });
   const addedRef = useRef(false);

   const handleAppend = useCallback(() => {
      if (fields.length >= MAX_VARIANTS) return;
      addedRef.current = true;
      append({ ...createItemVariantDefaultValues, id: crypto.randomUUID() });
   }, [append, fields.length]);

   // Put the cursor in the new variant's name so it can be typed straight away (focus also scrolls it into view).
   useEffect(() => {
      if (!addedRef.current) return;
      addedRef.current = false;
      setFocus(`variants.${fields.length - 1}.variant_name`);
   }, [fields.length, setFocus]);

   const atLimit = fields.length >= MAX_VARIANTS;

   return (
      <section className='flex min-h-0 flex-col gap-3'>
         <header>
            <h3 className='text-sm font-semibold text-foreground'>
               Variants <span className='font-medium text-neutral-500'>· {fields.length}</span>
            </h3>
            <p className='text-xs text-neutral-500'>
               Sizes, colours or other versions. Stock levels go reorder ≤ safe ≤ max.
            </p>
         </header>

         <div className='flex min-h-0 flex-col'>
            <div className={cn(ROW, "border-b border-neutral-200 pb-1.5 text-xs font-semibold text-neutral-500")}>
               <span>Name</span>
               {LEVELS.map((l) => (
                  <span key={l.key} className='text-center'>
                     {l.label}
                  </span>
               ))}
               <span />
            </div>

            {/* Radix wraps content in a display:table div that grows to fit; block keeps rows at the column's width. */}
            <ScrollArea
               className={cn("max-h-[50vh] [&_[data-slot=scroll-area-viewport]>div]:!block", scrollClassName)}
            >
               <ol className='flex flex-col divide-y divide-neutral-100 pr-1'>
                  {fields.map((field, index) => (
                     <VariantRow key={field.id} index={index} canRemove={fields.length > 1} onRemove={() => remove(index)} />
                  ))}
               </ol>
            </ScrollArea>

            <button
               type='button'
               onClick={handleAppend}
               disabled={atLimit}
               className='mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-foreground disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            >
               <Plus className='size-4' aria-hidden='true' />
               {atLimit ? `Limit of ${MAX_VARIANTS} variants reached` : "Add variant"}
            </button>
         </div>
      </section>
   );
}

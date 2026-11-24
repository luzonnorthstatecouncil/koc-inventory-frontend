import IInput from "@/components/custom/Input";
import ISelect from "@/components/custom/Select";
import { useGetCategoryListQuery } from "@/features/api/category";
import { optionParser } from "@/helpers/parser";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { useGetKitCapacityQuery } from "@/features/api/kit";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

export default function KitDetails({ kitId }) {
   const { data: categoryList } = useGetCategoryListQuery();

   return (
      <section className='flex flex-col gap-4'>
         <IInput name='name' label='Kit name' placeholder='e.g. Starter Pack A' />

         <fieldset className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <IInput name='sku' label='SKU' placeholder='e.g. KIT-001' />
            <ISelect
               name='category_id'
               label='Category'
               showAll={false}
               className='w-full'
               placeholder='Select a category'
               options={optionParser(categoryList, "id", ["name"])}
            />
         </fieldset>

         <fieldset className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <IInput
               name='price'
               label='Price'
               type='number'
               placeholder='0.00'
               prefix={<span className='text-sm font-medium text-neutral-500'>₱</span>}
            />
            <ISelect
               name='status'
               label='Status'
               showAll={false}
               className='w-full'
               options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
               ]}
            />
         </fieldset>

         <div className='flex flex-col gap-1.5 rounded-lg border border-neutral-200 bg-white p-3'>
            <IInput name='locked_qty' label='Pre-assembled' type='number' placeholder='0' wrapperClassName='max-w-32' />
            <p className='text-xs text-neutral-500'>
               Kits to put together now. Their component stock is reserved straight away.
            </p>
            <CapacityHint kitId={kitId} />
         </div>
      </section>
   );
}

/** Live "you can pre-assemble up to N" from the components currently in the form. */
function CapacityHint({ kitId }) {
   const items = useWatch({ name: "items" });
   const lockedQty = Number(useWatch({ name: "locked_qty" })) || 0;

   // Only complete rows, in a stable shape so typing elsewhere doesn't refetch
   const key = JSON.stringify(
      (items || [])
         .filter((i) => i?.variant_id && Number(i.quantity) > 0)
         .map((i) => ({ variant_id: Number(i.variant_id), quantity: Number(i.quantity) })),
   );
   const debouncedKey = useDebounce(key, 400);
   const validItems = useMemo(() => JSON.parse(debouncedKey), [debouncedKey]);

   const { data, isFetching, isError } = useGetKitCapacityQuery(
      { kit_id: kitId, items: validItems },
      { skip: validItems.length === 0 },
   );

   if (validItems.length === 0) {
      return <p className='text-xs text-neutral-500'>Add components to see how many you can pre-assemble.</p>;
   }
   if (isError) return null;
   if (!data) return <p className='text-xs text-neutral-400'>Checking component stock…</p>;

   const over = lockedQty > data.max;
   const limiting = data.limiting;

   return (
      <p
         className={cn("text-xs", over ? "text-red-600" : "text-neutral-600", isFetching && "opacity-60")}
         aria-live='polite'
      >
         {data.max > 0 ? (
            <>
               You can pre-assemble up to <span className='font-semibold tabular-nums'>{data.max}</span>{" "}
               {data.max === 1 ? "kit" : "kits"} with the stock available.
            </>
         ) : (
            "Not enough component stock to pre-assemble any kits."
         )}
         {limiting && (data.max === 0 || over || data.components.length > 1) && (
            <span className='block text-neutral-500'>
               Limited by {limiting.name}: {limiting.available} available, {limiting.per_kit} per kit.
            </span>
         )}
      </p>
   );
}

import ICheckbox from "@/components/custom/Checkbox";
import IInput from "@/components/custom/Input";
import ModalSkeleton from "@/components/custom/ModalSkeleton";
import ISelect from "@/components/custom/Select";
import ITextarea from "@/components/custom/Textarea";
import { UNIT_OPTIONS } from "@/constants/options";
import { useGetCategoryListQuery } from "@/features/api/category";
import { optionParser } from "@/helpers/parser";

/** A checkbox with a one-line explanation, so it's clear what turning it on does. */
function Toggle({ name, label, hint, disabled }) {
   return (
      <div className='flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-2.5'>
         <ICheckbox name={name} label={label} disabled={disabled} labelClassName='text-sm font-medium' />
         <p className='pl-6 text-xs text-neutral-500'>{hint}</p>
      </div>
   );
}

export default function ItemDetails({ isCreate = true, currentQty }) {
   const { data: categoryList, isLoading: isLoadingCategories } = useGetCategoryListQuery();

   if (isLoadingCategories) return <ModalSkeleton />;

   const locked = currentQty <= 0;

   return (
      <section className='flex flex-col gap-4'>
         {!isCreate && (
            <fieldset className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
               <IInput label='SKU' name='sku' placeholder='Enter SKU' />
               <IInput label='Serial number' name='serial_number' placeholder='Enter serial number' />
            </fieldset>
         )}

         <IInput label='Product name' name='name' placeholder='e.g. KofC Polo Shirt' />

         <fieldset className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <ISelect
               showAll={false}
               label='Category'
               name='category_id'
               className='w-full'
               placeholder='Select category'
               options={optionParser(categoryList, "id", "name")}
            />
            <ISelect
               label='Unit'
               showAll={false}
               name='unit'
               className='w-full'
               placeholder='Select unit'
               options={UNIT_OPTIONS}
            />
         </fieldset>

         <IInput
            label='Unit price'
            name='price'
            placeholder='0.00'
            parse='numeric'
            type='number'
            prefix={<span className='text-sm font-medium text-neutral-500'>₱</span>}
         />

         <ITextarea label='Description (optional)' name='description' placeholder='What staff should know about this item' rows={3} />

         <fieldset className='flex flex-col gap-2'>
            <Toggle name='status' label='Active' hint='Shown on the Sales screen and can be sold.' disabled={locked} />
            {isCreate && (
               <Toggle
                  name='has_expiry'
                  label='Tracks expiry'
                  hint='Each stock batch gets an expiry date.'
                  disabled={locked}
               />
            )}
         </fieldset>
      </section>
   );
}

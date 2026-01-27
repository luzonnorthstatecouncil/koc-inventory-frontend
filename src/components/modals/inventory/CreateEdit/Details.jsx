import ICheckbox from "@/components/custom/Checkbox";
import IInput from "@/components/custom/Input";
import ModalSkeleton from "@/components/custom/ModalSkeleton";
import ISelect from "@/components/custom/Select";
import ITextarea from "@/components/custom/Textarea";
import { UNIT_OPTIONS } from "@/constants/options";
import { useGetCategoryListQuery } from "@/features/api/category";
import { optionParser } from "@/helpers/parser";

export default function ItemDetails({ isCreate = true, currentQty }) {
   const { data: categoryList, isLoading: isLoadingCategories } = useGetCategoryListQuery();

   if (isLoadingCategories) return <ModalSkeleton />;

   return (
      <section className='space-y-4'>
         {!isCreate && (
            <fieldset className='grid grid-cols-1 md:grid-cols-2 gap-2'>
               <IInput label='SKU' name='sku' placeholder='Enter sku' />
               <IInput label='Serial Number' name='serial_number' placeholder='Enter serial number' />
            </fieldset>
         )}

         <fieldset className='grid grid-cols-1 md:grid-cols-3 gap-2'>
            <IInput wrapperClassName='col-span-2' label='Product Name' name='name' placeholder='Enter product name' />
            <ISelect
               showAll={false}
               label='Category'
               name='category_id'
               className='w-full'
               placeholder='Select category'
               options={optionParser(categoryList, "id", "name")}
            />
         </fieldset>

         <fieldset className='grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-4'>
            <IInput label='Unit Price' name='price' placeholder='Enter unit price' parse='numeric' type='number' />
            <ISelect
               label='Unit'
               showAll={false}
               name='unit'
               className='w-full'
               placeholder='Select unit'
               options={UNIT_OPTIONS}
            />
         </fieldset>

         <ITextarea
            label='Description (Optional)'
            name='description'
            placeholder='Enter product description'
            rows={4}
         />

         <ICheckbox label='Active' name='status' disabled={currentQty <= 0} />
         {isCreate && <ICheckbox label='Has Expiration' name='has_expiry' disabled={currentQty <= 0} />}
      </section>
   );
}

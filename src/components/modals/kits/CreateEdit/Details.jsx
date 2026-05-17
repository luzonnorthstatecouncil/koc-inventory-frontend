import IInput from "@/components/custom/Input";
import ISelect from "@/components/custom/Select";
import { useGetCategoryListQuery } from "@/features/api/category";
import { optionParser } from "@/helpers/parser";

export default function KitDetails() {
   const { data: categoryList } = useGetCategoryListQuery();
   return (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
         <IInput
            name='name'
            label='Kit Name'
            placeholder='e.g., Starter Pack A'
            wrapperClassName='col-span-1 md:col-span-2'
         />
         <IInput name='sku' label='SKU' placeholder='e.g., KIT-001' />
         <ISelect
            name='category_id'
            label='Category'
            placeholder='Select a category'
            options={optionParser(categoryList, "id", ["name"])}
         />
         <IInput name='price' label='Total Price (PHP)' type='number' placeholder='0.00' />
         <ISelect
            name='status'
            label='Status'
            className='col-span-full'
            triggerClassName='w-1/4'
            options={[
               { value: "active", label: "Active" },
               { value: "inactive", label: "Inactive" },
            ]}
         />
      </div>
   );
}

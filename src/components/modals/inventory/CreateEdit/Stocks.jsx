import IButton from "@/components/custom/Button";
import DatePicker from "@/components/custom/DatePicker";
import Details from "@/components/custom/Details";
import IInput from "@/components/custom/Input";
import Paragraph from "@/components/custom/Paragraph";
import ISelect from "@/components/custom/Select";
import ITextarea from "@/components/custom/Textarea";
import Title from "@/components/custom/Title";
import { useGetSupplierListQuery } from "@/features/api/supplier";
import { setOpenStocksModal } from "@/features/slice/inventorySlice";
import { optionParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useDispatch } from "react-redux";

export default function ItemStocks({ isCreate = true, currentQty }) {
   const { formState } = useFormContext();
   const dispatch = useDispatch();

   const today = new Date();
   const minDateExpiry = new Date(today.setDate(today.getDate() + 1));
   const { data: supplierList = [] } = useGetSupplierListQuery({ pageSize: 1000, status: "active" });

   const onManageStock = useCallback(() => {
      dispatch(setOpenStocksModal(true));
   }, [dispatch]);

   return (
      <section className='space-y-6'>
         {isCreate && (
            <fieldset className='grid grid-cols-2 gap-4'>
               <IInput
                  name='current_qty'
                  label='Initial Quantity'
                  type='number'
                  step={5}
                  relatedKeys={["expires_at"]}
               />
               <DatePicker name='expires_at' label='Expires At' type='date' minDate={minDateExpiry} />
            </fieldset>
         )}

         {!isCreate && (
            <div className='flex items-center justify-between gap-12'>
               <div>
                  <Title className='mb-0' size='xl'>
                     {currentQty} current stock{currentQty > 1 && "s"}
                  </Title>
                  <Paragraph className='mb-2 w-3/4' size='xs'>
                     Number of stocks available for this item. You cannot set the{" "}
                     <span className='font-semibold'>Max Quantity Level</span> lower than the current stock.
                  </Paragraph>
               </div>
            </div>
         )}

         <fieldset className={cn("grid grid-cols-3 gap-4", !isCreate && "py-3")}>
            <IInput name='reorder_level' label='Reorder Level' type='number' step={5} min={5} />
            <IInput name='safe_qty_level' label='Safe Quantity Level' type='number' step={5} min={10} />
            <IInput name='max_qty_level' label='Max Quantity Level' type='number' step={5} min={currentQty + 1 || 20} />
         </fieldset>

         {isCreate && (
            <>
               <ISelect
                  showAll={false}
                  label="Supplier's Name"
                  name='supplier_id'
                  className='w-full mb-6'
                  placeholder='Choose suppplier'
                  options={optionParser(supplierList?.data, "id", "name")}
               />
               <ITextarea
                  label='Remarks (Optional)'
                  name='remarks'
                  placeholder='State here additional information...'
                  rows={4}
               />
            </>
         )}
      </section>
   );
}

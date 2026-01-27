import Paragraph from "@/components/custom/Paragraph";
import ITabs from "@/components/custom/Tabs";
import Title from "@/components/custom/Title";
import Form from "@/components/custom/Form";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";
import Details from "@/components/custom/Details";
import ISelect from "@/components/custom/Select";
import InputNumber from "@/components/custom/InputNumber";
import ITextarea from "@/components/custom/Textarea";
import ModalSkeleton from "@/components/custom/ModalSkeleton";
import DatePicker from "@/components/custom/DatePicker";

import { cn } from "@/lib/utils";
import { addOthers, optionParser } from "@/helpers/parser";
import { AlertCircle, PackageMinus, PackagePlus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { REMOVE_STOCK_REMARKS_OPTIONS } from "@/constants/options";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import { manageStockDefaultValues, manageStockSchema } from "@/lib/zod/schema/manageStock";
import { useFormContext } from "react-hook-form";
import { useCreateStockMutation, useRemoveStockMutation } from "@/features/api/inventory";
import { addDays, startOfDay } from "date-fns";

export default function Stocks({ item: inventoryItem, inventoryStocks, isLoading, onClose }) {
   const [tab, setTab] = useState("stock_in");
   const { confirm } = useConfirmation();
   const [createStock] = useCreateStockMutation();
   const [removeStock] = useRemoveStockMutation();
   const exec = useCatchQuery();

   const isStockIn = useMemo(() => tab === "stock_in", [tab]);

   const onSubmit = useCallback(
      async (data) => {
         const stockBatch = inventoryStocks?.find((stock) => stock?.id == data.inventory_stock_id);

         const confirmed = await confirm({
            title: isStockIn ? "Stock In" : "Stock Out",
            message: `This will ${isStockIn ? "add" : "remove"} ${data.quantity} stock${data.quantity > 1 ? "s" : ""} ${
               isStockIn ? "to" : "from"
            }  ${isStockIn ? "this item" : stockBatch.reference_no}. Are you sure you want to proceed?`,
         });

         if (!confirmed) return;

         const payload = {
            ...data,
            batch_quantity: data.quantity,
            current_quantity: inventoryItem?.current_qty,
            remarks: data.remarks_others || data.remarks,
            inventory_id: inventoryItem?.id,
         };

         delete payload.remarks_others;

         const { success, message } = await exec(isStockIn ? createStock : removeStock, payload);
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [tab, inventoryStocks]
   );

   if (isLoading) {
      return <ModalSkeleton />;
   }

   return (
      <Form
         className='flex flex-col gap-4'
         onSubmit={onSubmit}
         schema={manageStockSchema}
         defaultValues={{
            ...manageStockDefaultValues,
            inventory_id: inventoryItem.id,
         }}
      >
         <StocksContent item={inventoryItem} onClose={onClose} tab={tab} setTab={setTab} stocks={inventoryStocks} />
      </Form>
   );
}

function StocksContent({ item, onClose, tab, setTab, stocks }) {
   const { formState, setValue, clearErrors } = useFormContext();
   const formValues = useMemo(() => formState?.values, [formState?.values]);
   const formErrors = useMemo(() => formState?.errors, [formState?.errors]);

   const stockOptions = useMemo(() => {
      return optionParser(stocks, "id", ["reference_no", "batch_quantity"]);
   }, [stocks]);

   const { stockInMaxQuantity, stockMaxedOut, outOfStock, isStockIn, minDateExpiry } = useMemo(() => {
      const today = new Date();

      return {
         stockInMaxQuantity: item.max_qty_level - item.current_qty,
         stockMaxedOut: item.current_qty >= item.max_qty_level,
         outOfStock: item.current_qty <= 0,
         isStockIn: tab === "stock_in",
         minDateExpiry: new Date(today.setDate(today.getDate() + 1)),
      };
   }, [item, tab]);

   const maxQuantity = useMemo(() => {
      if (formValues && formValues.type === "stock_in") return item.max_qty_level - item.current_qty;

      const stock = stocks?.find((stock) => stock?.id == formValues?.inventory_stock_id);
      return stock?.batch_quantity;
   }, [formValues, stocks]);

   const onTabChange = useCallback((value) => {
      setTab(value);
      clearErrors();
      setValue("type", value);
      setValue("quantity", null);
      setValue("remarks", null);
      setValue("inventory_stock_id", null);
   }, []);

   const tabs = useMemo(
      () => [
         {
            label: (
               <div
                  className={cn(isStockIn ? "text-green-500" : "text-gray-400", "flex items-center gap-1 font-normal")}
               >
                  <PackagePlus size={24} />
                  <span className='ml-2'>Stock In</span>
               </div>
            ),
            value: "stock_in",
         },
         {
            label: (
               <div
                  className={cn(
                     tab === "stock_out" ? "text-destructive" : "text-gray-400",
                     "flex items-center gap-1 font-normal"
                  )}
               >
                  <PackageMinus size={24} />
                  <span className='ml-2'>Stock Out</span>
               </div>
            ),
            value: "stock_out",
         },
      ],
      [tab]
   );

   return (
      <div className='w-full flex flex-col relative'>
         <Title className='grid grid-cols-2 gap-2' size='base' variant='default'>
            <span>{item.name}</span>
            <Paragraph size='sm' variant='muted' className='font-normal text-end flex items-center justify-end gap-1'>
               Current: <strong className='text-gray-800'>{item.current_qty}</strong> / {item.max_qty_level}
            </Paragraph>
         </Title>

         <ITabs
            className='mt-4'
            tabListClassName='w-full border border-outline bg-muted h-10'
            defaultValue='stock_in'
            items={tabs}
            onTabChange={onTabChange}
         />

         <div className='relative mb-3'>
            {stockMaxedOut && isStockIn && (
               <div className='absolute bg-white/80 rounded-lg w-full h-full flex items-center justify-center z-40'>
                  <p className='mb-6 flex items-center gap-2 font-semibold'>
                     <AlertCircle className='size-6' />
                     <span>Stock is already maxed out.</span>
                  </p>
               </div>
            )}

            {(outOfStock || !stockOptions.length) && tab === "stock_out" && (
               <div className='absolute bg-white/80 rounded-lg w-full h-full flex items-center justify-center z-40'>
                  <p className='mb-6 flex items-center gap-2 font-semibold'>
                     <AlertCircle className='size-6' />
                     <span>Already out of stock.</span>
                  </p>
               </div>
            )}

            {tab === "stock_out" && (
               <ISelect
                  className='mb-3'
                  showAll={false}
                  name='inventory_stock_id'
                  label='Stock Batches'
                  options={stockOptions}
                  relatedKeys={["quantity"]}
                  triggerClassName='bg-white'
               />
            )}

            <div className='flex items-center justify-between gap-3 mb-3'>
               <div className='flex flex-col'>
                  <Details label='Number of Item' description='Enter the number of items to add or remove.' />
                  {formErrors.quantity && (
                     <span className='text-destructive text-xs'>{formErrors.quantity.message}</span>
                  )}
               </div>
               <InputNumber
                  max={maxQuantity || stockInMaxQuantity}
                  requireMax={tab === "stock_out"}
                  name='quantity'
                  steps={10}
                  disabled={!formValues?.inventory_stock_id && tab === "stock_out"}
               />
            </div>

            {isStockIn && (
               <>
                  <div className='flex items-center justify-between gap-3 mb-3'>
                     <div className='flex flex-col'>
                        <Details label='Received At' description='Enter the received date of this batch.' />
                        {formErrors.received_at && (
                           <span className='text-destructive text-xs'>{formErrors.received_at.message}</span>
                        )}
                     </div>
                     <DatePicker
                        showClear={false}
                        showError={false}
                        name='received_at'
                        label={null}
                        type='date'
                        maxDate={new Date()}
                        className='bg-white'
                     />
                  </div>
                  <div className='flex items-center justify-between gap-3 mb-3'>
                     <div className='flex flex-col'>
                        <Details label='Expires At' description='Enter the expiration date of this batch.' />
                        {formErrors.expires_at && (
                           <span className='text-destructive text-xs'>{formErrors.expires_at.message}</span>
                        )}
                     </div>
                     <DatePicker
                        showClear={false}
                        showError={false}
                        name='expires_at'
                        label={null}
                        type='date'
                        minDate={minDateExpiry}
                        className='bg-white'
                     />
                  </div>
               </>
            )}

            <Separator className='my-4' />

            {isStockIn && (
               <ITextarea
                  name='remarks'
                  label='Remarks (Optional)'
                  placeholder='e.g. Purchased from supplier, etc.'
                  className='bg-white'
               />
            )}

            {tab === "stock_out" && (
               <div>
                  <ISelect
                     showAll={false}
                     name='remarks'
                     label='Remarks'
                     options={addOthers(REMOVE_STOCK_REMARKS_OPTIONS)}
                     triggerClassName='bg-white'
                     relatedKeys={["remarks_others"]}
                  />

                  {formValues?.remarks === "others" && (
                     <ITextarea
                        name='remarks_others'
                        placeholder='State other reason here...'
                        className='bg-white'
                        wrapperClassName='mt-2'
                     />
                  )}
               </div>
            )}
         </div>

         <div className='flex items-center justify-end gap-2'>
            <IButtonConfirm
               title='Cancel Creation'
               message='Are you sure you want to cancel? All unsaved changes will be lost.'
               asButton
               onConfirm={onClose}
            >
               Cancel
            </IButtonConfirm>
            <IButton type='submit' variant='default'>
               {tab === "stock_out" ? "Remove Stock" : "Add Stock"}
            </IButton>
         </div>
      </div>
   );
}

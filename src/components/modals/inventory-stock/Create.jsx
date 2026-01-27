import Form from "@/components/custom/Form";
import { createItemDefaultValues, createItemSchema } from "@/lib/zod/schema/createItem";
import { useCallback, useEffect } from "react";
import { useConfirmation } from "@/helpers/confirmAction";
import {
   useCreateNewItemMutation,
   useCreateStockMutation,
   useGetInventoryAsOptionsPaginatedQuery,
} from "@/features/api/inventory";
import { useGetSupplierListQuery } from "@/features/api/supplier";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { optionParser, parseArray } from "@/helpers/parser";
import { toast } from "sonner";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";
import ITextarea from "@/components/custom/Textarea";
import { Separator } from "@/components/ui/separator";
import DatePicker from "@/components/custom/DatePicker";
import Details from "@/components/custom/Details";
import InputNumber from "@/components/custom/InputNumber";
import ILineChart from "@/components/custom/LineChart";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import ISelect from "@/components/custom/Select";
import { manageStockDefaultValues, manageStockSchema } from "@/lib/zod/schema/manageStock";
import Title from "@/components/custom/Title";
import Paragraph from "@/components/custom/Paragraph";
import SelectAsync from "@/components/custom/SelectAsync";
import { useUser } from "@/hooks/useUser";
import { Alert, AlertDescription } from "@/components/ui/alert";
import IInput from "@/components/custom/Input";

const chartConfig = {
   total_in: {
      label: "Received",
      color: "var(--chart-1)",
   },
   total_out: {
      label: "Sold/Out",
      color: "var(--chart-2)",
   },
};

// This is the custom footer content
const CustomFooter = ({ percentage = 0, direction = "up" }) => (
   <div className='space-y-1'>
      <Title size='sm' className='flex gap-2 leading-none font-medium'>
         Trending up by {percentage}% this month{" "}
         {direction === "up" ? (
            <TrendingUp className='size-4 text-green-600' />
         ) : (
            <TrendingDown className='size-4 text-destructive' />
         )}
      </Title>
      <Paragraph className='text-muted-foreground leading-none'>
         Showing total stocks received from the last 6 months
      </Paragraph>
   </div>
);

export default function Create({ onClose, inventoryOptions }) {
   const { confirm } = useConfirmation();
   const [createStock] = useCreateStockMutation();
   const { data: supplierList = [] } = useGetSupplierListQuery({ pageSize: 1000, status: "active" });
   const exec = useCatchQuery();
   const user = useUser();

   const today = new Date();
   const minDateExpiry = new Date(today.setDate(today.getDate() + 1));

   const onSubmit = useCallback(
      async (data) => {
         const isSupervisor = user?.role === "supervisor";

         const confirmed = await confirm({
            title: isSupervisor ? "Request New Stocks" : "Submit New Stocks",
            message: isSupervisor
               ? "This will send a request to the administrator to approve the new stock. Do you want to proceed?"
               : "Are you sure you want to submit this new stock?",
         });

         if (!confirmed) return;

         const { inventory_stock_id, remarks_others, ...rest } = data;

         const { success, message } = await exec(createStock, rest);
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [confirm, createStock, exec, onClose],
   );

   return (
      <>
         <Form
            className='flex flex-col gap-4'
            onSubmit={onSubmit}
            schema={manageStockSchema}
            defaultValues={manageStockDefaultValues}
         >
            {(form) => {
               const formErrors = form.formState.errors;
               const formValues = form.watch();
               const inventory = inventoryOptions.find((item) => item.id == formValues.variant_id);
               const hasPendingStockRequest = inventory?.has_pending_request;

               useEffect(() => {
                  if (inventory) {
                     form.setValue("has_expiry", Boolean(inventory.has_expiry), { shouldValidate: true });
                  }
               }, [inventory?.id, inventory?.has_expiry]);

               return (
                  <div className='grid grid-cols-2 gap-x-4'>
                     <div>
                        {hasPendingStockRequest && (
                           <Alert className='mb-4 border border-destructive bg-red-50'>
                              <AlertDescription className='text-xs text-destructive flex items-center gap-2'>
                                 <span>
                                    <AlertTriangle className='size-4' />
                                 </span>
                                 There is a pending stock request for this item. Adding stock now may affect the pending
                                 request.
                              </AlertDescription>
                           </Alert>
                        )}

                        <ISelect
                           showAll={false}
                           label='Inventory Variant'
                           name='variant_id'
                           className='w-full mb-2'
                           placeholder='Choose variant'
                           options={optionParser(inventoryOptions, "id", "name")}
                        />

                        <ILineChart
                           data={inventory?.line_chart_data || []}
                           config={chartConfig}
                           title='Stocks Received'
                           xAxisKey='month'
                           contentClassName='h-40'
                           wrapperClassName='bg-white mb-4'
                           emptyMessage={
                              !formValues.variant_id
                                 ? "Choose inventory item above to view stocks "
                                 : "This stock does not have any stocks."
                           }
                           footer={
                              Boolean(inventory?.line_chart_data.length) ? (
                                 <CustomFooter percentage={inventory?.trend_percentage || 0} />
                              ) : null
                           }
                        />
                     </div>

                     <div className='relative mb-3'>
                        {inventory && (
                           <header className='mb-3 border-b pb-3'>
                              <Title size='2xl'>
                                 {inventory.current_qty} stock
                                 {inventory.current_qty > 1 && "s"}
                              </Title>
                              <Paragraph size='sm'>Max Quantity Level: {inventory.max_qty_level}</Paragraph>
                           </header>
                        )}
                        <div className='flex items-center justify-between gap-3 mb-3'>
                           <div className='flex flex-col'>
                              <Details label='Number of Item' description='Enter the number of items to add.' />
                              {formErrors.quantity && (
                                 <span className='text-destructive text-xs'>{formErrors.quantity.message}</span>
                              )}
                           </div>
                           <InputNumber
                              max={inventory ? inventory?.max_qty_level - inventory?.current_qty : ""}
                              requireMax
                              name='quantity'
                              steps={10}
                              disabled={hasPendingStockRequest}
                           />
                        </div>

                        <div className='flex items-center justify-between gap-3 mb-3'>
                           <div className='flex flex-col'>
                              <Details label='Received At' description='Enter the received date of this batch.' />
                              {formErrors.received_at && (
                                 <span className='text-destructive text-xs'>{formErrors.received_at.message}</span>
                              )}
                           </div>
                           <DatePicker
                              showError={false}
                              showClear={false}
                              name='received_at'
                              label={null}
                              type='date'
                              maxDate={new Date()}
                              className='bg-white'
                              disabled={hasPendingStockRequest}
                           />
                        </div>

                        <div className='flex items-center justify-between gap-3 mb-3'>
                           <div className='flex flex-col'>
                              <Details
                                 label='Expires At'
                                 description={
                                    inventory?.has_expiry
                                       ? "Enter the expiration date of this batch."
                                       : "This item doesn't track expiration dates."
                                 }
                              />
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
                              disabled={hasPendingStockRequest || !inventory?.has_expiry}
                           />
                        </div>

                        <Separator className='my-4' />

                        <ISelect
                           showAll={false}
                           label="Supplier's Name"
                           name='supplier_id'
                           className='w-full mb-4'
                           placeholder='Choose suppplier'
                           options={optionParser(supplierList?.data, "id", "name")}
                           disabled={hasPendingStockRequest}
                        />

                        <IInput
                           wrapperClassName='mb-4'
                           name='reference_no'
                           label='Invoice Number (Optional)'
                           placeholder='Enter invoice number'
                           parse='reference_no'
                           description='If available, enter the invoice number from the supplier`s receipt.'
                           disabled={hasPendingStockRequest}
                        />

                        <ITextarea
                           name='remarks'
                           label='Remarks (Optional)'
                           placeholder='e.g. Purchased from supplier, etc.'
                           className='bg-white'
                           disabled={hasPendingStockRequest}
                        />
                     </div>

                     <div className='flex items-center justify-end gap-2 mt-auto col-span-2'>
                        <IButtonConfirm
                           title='Cancel Creation'
                           message='Are you sure you want to cancel? All unsaved changes will be lost.'
                           asButton
                           onConfirm={onClose}
                           isDirty={form.formState.isDirty}
                        >
                           Cancel
                        </IButtonConfirm>
                        <IButton type='submit' variant='default' disabled={hasPendingStockRequest}>
                           Create Item
                        </IButton>
                     </div>
                  </div>
               );
            }}
         </Form>
      </>
   );
}

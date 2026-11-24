import Form from "@/components/custom/Form";
import { useCallback, useEffect } from "react";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCreateStockMutation } from "@/features/api/inventory";
import { useGetSupplierListQuery } from "@/features/api/supplier";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { optionParser } from "@/helpers/parser";
import { toast } from "sonner";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";
import ITextarea from "@/components/custom/Textarea";
import DatePicker from "@/components/custom/DatePicker";
import ILineChart from "@/components/custom/LineChart";
import { TriangleAlert } from "lucide-react";
import ISelect from "@/components/custom/Select";
import { manageStockDefaultValues, manageStockSchema } from "@/lib/zod/schema/manageStock";
import { useUser } from "@/hooks/useUser";
import IInput from "@/components/custom/Input";
import { cn } from "@/lib/utils";

const chartConfig = {
   total_in: { label: "Received", color: "var(--primary)" },
   total_out: { label: "Sold / out", color: "var(--color-neutral-400)" },
};

/** Keeps the form's has_expiry flag in sync with the selected item (a hook can't live in the render callback). */
function SyncHasExpiry({ form, inventory }) {
   useEffect(() => {
      if (inventory) {
         form.setValue("has_expiry", Boolean(inventory.has_expiry), { shouldValidate: true });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [inventory?.id, inventory?.has_expiry]);
   return null;
}

function SectionTitle({ title, hint }) {
   return (
      <div>
         <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
         {hint && <p className='text-xs text-neutral-500'>{hint}</p>}
      </div>
   );
}

/**
 * Add a stock batch. `prefill` ({ variantId, quantity, supplierId }) comes from the restock shortcuts.
 */
export default function Create({ onClose, inventoryOptions, prefill }) {
   const { confirm } = useConfirmation();
   const [createStock] = useCreateStockMutation();
   const { data: supplierList = [] } = useGetSupplierListQuery({
      pageSize: 1000,
      status: "active",
   });
   const exec = useCatchQuery();
   const user = useUser();
   const isSupervisor = user?.role === "supervisor";

   const today = new Date();
   const minDateExpiry = new Date(today.setDate(today.getDate() + 1));

   const onSubmit = useCallback(
      async (data) => {
         const confirmed = await confirm({
            title: isSupervisor ? "Request this stock?" : "Add this stock?",
            message: isSupervisor
               ? "An administrator has to approve the new stock before it's added."
               : "The batch will be added to the item's stock.",
         });

         if (!confirmed) return;

         const { inventory_stock_id, remarks_others, ...rest } = data;

         const { success, message } = await exec(createStock, rest);
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [confirm, createStock, exec, onClose, isSupervisor],
   );

   return (
      <Form
         className='flex flex-col gap-5'
         onSubmit={onSubmit}
         schema={manageStockSchema}
         defaultValues={{
            ...manageStockDefaultValues,
            ...(prefill?.variantId != null && { variant_id: String(prefill.variantId) }),
            ...(prefill?.quantity && { quantity: Number(prefill.quantity) }),
            ...(prefill?.supplierId != null && { supplier_id: String(prefill.supplierId) }),
         }}
      >
         {(form) => {
            const formValues = form.watch();
            const inventory = inventoryOptions.find((item) => item.id == formValues.variant_id);
            const pending = Boolean(inventory?.has_pending_request);
            const current = Number(inventory?.current_qty) || 0;
            const max = Number(inventory?.max_qty_level) || 0;
            const room = Math.max(max - current, 0);

            return (
               <>
                  <SyncHasExpiry form={form} inventory={inventory} />

                  <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                     {/* Which item, and where its stock stands */}
                     <div className='flex flex-col gap-3'>
                        <SectionTitle title='Item' hint='Choose the item and variant this batch is for.' />
                        <ISelect
                           showAll={false}
                           label='Item'
                           name='variant_id'
                           className='w-full'
                           placeholder='Choose item'
                           options={optionParser(inventoryOptions, "id", "name")}
                        />

                        {inventory && (
                           <dl className='grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200'>
                              {[
                                 { label: "In stock", value: current },
                                 { label: "Max level", value: max },
                                 { label: "Room left", value: room },
                              ].map((fact) => (
                                 <div key={fact.label} className='flex flex-col gap-0.5 bg-white px-3 py-2.5'>
                                    <dt className='text-xs text-neutral-500'>{fact.label}</dt>
                                    <dd className='text-base font-semibold text-foreground tabular-nums'>
                                       {fact.value.toLocaleString()}
                                    </dd>
                                 </div>
                              ))}
                           </dl>
                        )}

                        {pending && (
                           <div className='flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-amber-900'>
                              <TriangleAlert className='mt-0.5 size-4 shrink-0 opacity-70' aria-hidden='true' />
                              <p className='text-sm'>
                                 This item already has a stock request waiting for approval. Approve or reject it before adding
                                 more.
                              </p>
                           </div>
                        )}

                        <ILineChart
                           data={inventory?.line_chart_data || []}
                           config={chartConfig}
                           title='Received vs. sold, last 6 months'
                           xAxisKey='month'
                           contentClassName='h-36'
                           wrapperClassName='bg-white'
                           emptyMessage={!formValues.variant_id ? "Choose an item to see its stock history." : "No stock history yet."}
                        />
                     </div>

                     {/* The batch itself */}
                     <div className='flex flex-col gap-4 lg:border-l lg:border-neutral-200 lg:pl-6'>
                        <SectionTitle title='Batch' hint='What arrived, when, and from whom.' />

                        <div className='flex flex-col gap-1'>
                           <IInput
                              name='quantity'
                              label='Quantity'
                              type='number'
                              min={1}
                              max={inventory ? room : undefined}
                              placeholder='0'
                              disabled={pending}
                              className='tabular-nums'
                           />
                           {inventory && (
                              <p className={cn("text-xs", room > 0 ? "text-neutral-500" : "text-red-700")}>
                                 {room > 0
                                    ? `Up to ${room.toLocaleString()} more before reaching the max level.`
                                    : "This item is at its max level."}
                              </p>
                           )}
                        </div>

                        <fieldset className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                           <DatePicker
                              showClear={false}
                              name='received_at'
                              label='Received'
                              type='date'
                              maxDate={new Date()}
                              wrapperClassName='w-full' triggerClassName='bg-white'
                              disabled={pending}
                           />
                           <DatePicker
                              showClear={false}
                              name='expires_at'
                              label={inventory && !inventory.has_expiry ? "Expires (not tracked)" : "Expires"}
                              type='date'
                              minDate={minDateExpiry}
                              wrapperClassName='w-full' triggerClassName='bg-white'
                              disabled={pending || !inventory?.has_expiry}
                           />
                        </fieldset>

                        <ISelect
                           showAll={false}
                           label='Supplier'
                           name='supplier_id'
                           className='w-full'
                           placeholder='Choose supplier'
                           options={optionParser(supplierList?.data, "id", "name")}
                           disabled={pending}
                        />

                        <IInput
                           name='reference_no'
                           label='Invoice no. (optional)'
                           placeholder="From the supplier's receipt"
                           parse='reference_no'
                           disabled={pending}
                        />

                        <ITextarea
                           name='remarks'
                           label='Remarks (optional)'
                           placeholder='e.g. Delivered by the supplier'
                           rows={2}
                           className='bg-white'
                           disabled={pending}
                        />
                     </div>
                  </div>

                  <footer className='-mx-3 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                     <IButtonConfirm
                        title='Discard this batch?'
                        message='The details you entered will be lost.'
                        cancelLabel='Keep editing'
                        confirmLabel='Discard'
                        asButton
                        onConfirm={onClose}
                        isDirty={form.formState.isDirty}
                     >
                        Cancel
                     </IButtonConfirm>
                     <IButton type='submit' variant='default' disabled={pending}>
                        {isSupervisor ? "Request stock" : "Add stock"}
                     </IButton>
                  </footer>
               </>
            );
         }}
      </Form>
   );
}

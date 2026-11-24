import Form from "@/components/custom/Form";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";
import IInput from "@/components/custom/Input";
import ISelect from "@/components/custom/Select";
import ITextarea from "@/components/custom/Textarea";

import { addOthers } from "@/helpers/parser";
import { Info, TriangleAlert } from "lucide-react";
import { useCallback, useMemo } from "react";
import { ADJUSTMENT_STOCK_REMARKS_OPTIONS, REMOVE_STOCK_REMARKS_OPTIONS } from "@/constants/options";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import { editStockDefaultValues, editStockSchema } from "@/lib/zod/schema/manageStock";
import { useFormContext, useWatch } from "react-hook-form";
import { useAdjustStocksMutation } from "@/features/api/inventory";
import { cn } from "@/lib/utils";

export default function Edit({ item, onClose }) {
   const { confirm } = useConfirmation();
   const [adjustStock] = useAdjustStocksMutation();
   const exec = useCatchQuery();

   const hasPendingStockRequest = useMemo(() => {
      return item?.variant?.stockRequests?.some((request) => request.status === "pending");
   }, [item]);

   const onSubmit = useCallback(
      async (data) => {
         if (item.current_quantity === data.quantity) {
            toast.error("Enter a quantity different from what's on hand.");
            return;
         }

         const confirmed = await confirm({
            title: "Adjust this batch?",
            message: `Batch ${item.reference_no} goes from ${item.current_quantity} to ${data.quantity} on hand.`,
         });

         if (!confirmed) return;

         const formData = {
            ...data,
            remarks: data.remarks_others || data.remarks,
            current: item.current_quantity,
            adjustment_type: data.quantity > item.current_quantity ? "add" : "remove",
         };

         const { min_quantity, remarks_others, ...payload } = formData;

         const { success, message } = await exec(adjustStock, payload);
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [adjustStock, confirm, exec, item.current_quantity, item.reference_no, onClose],
   );

   return (
      <Form
         className='flex flex-col gap-4'
         onSubmit={onSubmit}
         schema={editStockSchema}
         defaultValues={{
            ...editStockDefaultValues,
            inventory_stock_id: item.id,
            quantity: item.current_quantity,
            min_quantity: item.current_quantity,
         }}
      >
         <StocksContent item={item} onClose={onClose} hasPendingStockRequest={hasPendingStockRequest} />
      </Form>
   );
}

function StocksContent({ item, onClose, hasPendingStockRequest }) {
   const { formState } = useFormContext();
   const quantity = useWatch({ name: "quantity" });
   const remarks = useWatch({ name: "remarks" });

   const current = Number(item.current_quantity) || 0;
   const next = Number(quantity);
   const delta = Number.isFinite(next) ? next - current : 0;
   const removing = Number.isFinite(next) && next <= current;
   const variant = item.variant?.variant_name;

   return (
      <div className='flex w-full flex-col gap-4'>
         <header className='flex items-start justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3'>
            <div className='flex min-w-0 flex-col gap-0.5'>
               <p className='truncate text-sm font-semibold text-foreground'>
                  {item.inventory?.name}
                  {variant && variant !== "Default" && <span className='font-medium text-neutral-500'> · {variant}</span>}
               </p>
               <p className='text-xs text-neutral-500 tabular-nums'>Batch {item.reference_no}</p>
            </div>
            <div className='flex shrink-0 flex-col items-end gap-0.5'>
               <p className='text-base font-semibold text-foreground tabular-nums'>{current.toLocaleString()}</p>
               <p className='text-xs text-neutral-500 tabular-nums'>
                  on hand · max {Number(item.variant?.max_qty_level || 0).toLocaleString()}
               </p>
            </div>
         </header>

         {hasPendingStockRequest ? (
            <div className='flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-amber-900'>
               <TriangleAlert className='mt-0.5 size-4 shrink-0 opacity-70' aria-hidden='true' />
               <p className='text-sm'>This item has a stock request waiting for approval. Settle it before adjusting.</p>
            </div>
         ) : (
            <div className='flex gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-neutral-700'>
               <Info className='mt-0.5 size-4 shrink-0 opacity-70' aria-hidden='true' />
               <p className='text-sm'>Enter what&apos;s actually on hand; the difference is added or removed for you.</p>
            </div>
         )}

         <div className='flex flex-col gap-1'>
            <IInput
               name='quantity'
               label='Quantity on hand'
               type='number'
               min={0}
               max={item.variant?.max_qty_level}
               disabled={hasPendingStockRequest}
               className='tabular-nums'
            />
            <p
               className={cn(
                  "text-xs tabular-nums",
                  delta === 0 ? "text-neutral-500" : delta < 0 ? "text-red-700" : "text-foreground",
               )}
            >
               {delta === 0
                  ? "No change yet."
                  : delta < 0
                    ? `Removes ${Math.abs(delta).toLocaleString()} from this batch.`
                    : `Adds ${delta.toLocaleString()} to this batch.`}
            </p>
         </div>

         <ISelect
            showAll={false}
            name='remarks'
            label='Reason'
            triggerClassName='bg-white'
            relatedKeys={["remarks_others"]}
            disabled={hasPendingStockRequest}
            options={addOthers(removing ? REMOVE_STOCK_REMARKS_OPTIONS : ADJUSTMENT_STOCK_REMARKS_OPTIONS)}
         />

         {remarks === "others" && (
            <ITextarea name='remarks_others' placeholder='Describe the reason' className='bg-white' rows={2} />
         )}

         <footer className='-mx-3 mt-1 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
            <IButtonConfirm
               title='Discard this adjustment?'
               message='The batch stays as it is.'
               cancelLabel='Keep editing'
               confirmLabel='Discard'
               asButton
               onConfirm={onClose}
               isDirty={formState.isDirty}
            >
               Cancel
            </IButtonConfirm>
            <IButton type='submit' variant='default' disabled={hasPendingStockRequest || delta === 0}>
               Save adjustment
            </IButton>
         </footer>
      </div>
   );
}

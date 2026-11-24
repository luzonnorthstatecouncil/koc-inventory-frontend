import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import DatePicker from "@/components/custom/DatePicker";
import Form from "@/components/custom/Form";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { useUpdateStockExpiryMutation } from "@/features/api/inventory";
import { adjustExpiryDefaultValues, adjustExpirySchema } from "@/lib/zod/schema/adjustExpiry";
import { dateParser } from "@/helpers/parser";
import { toast } from "sonner";
import { useCallback } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { cn } from "@/lib/utils";

/** The current expiry in words: red once passed, amber within 30 days. */
function currentExpiry(expiresAt) {
   if (!expiresAt) return { label: "No expiry date set", text: "text-neutral-500" };
   const days = differenceInCalendarDays(new Date(expiresAt), new Date());
   if (days < 0) return { label: `Expired ${Math.abs(days)} day${days === -1 ? "" : "s"} ago`, text: "text-red-700" };
   if (days <= 30) return { label: days === 0 ? "Expires today" : `Expires in ${days} day${days === 1 ? "" : "s"}`, text: "text-amber-700" };
   return { label: `Expires in ${days} days`, text: "text-neutral-500" };
}

export default function AdjustExpiry({ item, onClose }) {
   const { confirm } = useConfirmation();
   const [updateStockExpiry] = useUpdateStockExpiryMutation();
   const exec = useCatchQuery();
   const today = new Date();
   const minDateExpiry = new Date(today.setDate(today.getDate() + 1));
   const state = currentExpiry(item.expires_at);
   const variant = item.variant?.variant_name;

   const onSubmit = useCallback(
      async (data) => {
         const confirmed = await confirm({
            title: "Change the expiry date?",
            message: `Batch ${item.reference_no ?? ""} moves from ${dateParser(item.expires_at, "PP")} to ${dateParser(
               data.expires_at,
               "PP",
            )}.`,
         });

         if (!confirmed) return;

         const payload = {
            inventory_stock_id: item.id,
            expires_at: new Date(data.expires_at).toISOString(),
         };

         const { success, message } = await exec(updateStockExpiry, payload);
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [item, confirm, exec, updateStockExpiry, onClose],
   );

   return (
      <Form
         className='flex flex-col gap-4'
         onSubmit={onSubmit}
         schema={adjustExpirySchema}
         defaultValues={{
            ...adjustExpiryDefaultValues,
            expires_at: item.expires_at ? format(new Date(item.expires_at), "yyyy-MM-dd") : "",
         }}
      >
         {(form) => (
            <>
               <header className='flex items-start justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3'>
                  <div className='flex min-w-0 flex-col gap-0.5'>
                     <p className='truncate text-sm font-semibold text-foreground'>
                        {item.inventory?.name ?? "Stock batch"}
                        {variant && variant !== "Default" && <span className='font-medium text-neutral-500'> · {variant}</span>}
                     </p>
                     {item.reference_no && <p className='text-xs text-neutral-500 tabular-nums'>Batch {item.reference_no}</p>}
                  </div>
                  <div className='flex shrink-0 flex-col items-end gap-0.5'>
                     <p className='text-sm font-semibold text-foreground tabular-nums'>
                        {item.expires_at ? dateParser(item.expires_at, "PP") : "—"}
                     </p>
                     <p className={cn("text-xs tabular-nums", state.text)}>{state.label}</p>
                  </div>
               </header>

               <DatePicker
                  name='expires_at'
                  label='New expiry date'
                  placeholder='Select a date'
                  wrapperClassName='w-full'
                  minDate={minDateExpiry}
               />

               <footer className='-mx-3 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                  <IButtonConfirm
                     title='Discard this change?'
                     message='The expiry date stays as it is.'
                     cancelLabel='Keep editing'
                     confirmLabel='Discard'
                     asButton
                     onConfirm={onClose}
                     isDirty={form.formState.isDirty}
                  >
                     Cancel
                  </IButtonConfirm>
                  <IButton type='submit' variant='default'>
                     Save expiry date
                  </IButton>
               </footer>
            </>
         )}
      </Form>
   );
}

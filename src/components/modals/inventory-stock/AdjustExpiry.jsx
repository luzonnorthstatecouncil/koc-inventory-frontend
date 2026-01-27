import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import DatePicker from "@/components/custom/DatePicker";
import Details from "@/components/custom/Details";
import Form from "@/components/custom/Form";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { useUpdateStockExpiryMutation } from "@/features/api/inventory";
import { adjustExpiryDefaultValues, adjustExpirySchema } from "@/lib/zod/schema/adjustExpiry";
import { dateParser } from "@/helpers/parser";
import { toast } from "sonner";
import { useCallback } from "react";
import { format } from "date-fns";

export default function AdjustExpiry({ item, onClose }) {
   const { confirm } = useConfirmation();
   const [updateStockExpiry] = useUpdateStockExpiryMutation();
   const exec = useCatchQuery();
   const today = new Date();
   const minDateExpiry = new Date(today.setDate(today.getDate() + 1));

   const onSubmit = useCallback(
      async (data) => {
         const confirmed = await confirm({
            title: "Adjust Expiration Date",
            message: `Are you sure you want to change the expiration date from ${dateParser(
               item.expires_at,
               "PP",
            )} to ${dateParser(data.expires_at, "PP")}?`,
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
               <div className='space-y-3'>
                  <div>
                     <Title size='sm' className='font-semibold mb-2'>
                        New Expiration Date
                     </Title>
                     <DatePicker
                        name='expires_at'
                        label='Expiration Date'
                        placeholder='Select new expiration date'
                        wrapperClassName='w-full'
                        minDate={minDateExpiry}
                     />
                  </div>
               </div>

               <div className='flex items-center justify-end gap-2 pt-2'>
                  <IButtonConfirm
                     title='Cancel Adjustment'
                     message='Are you sure you want to cancel? All unsaved changes will be lost.'
                     asButton
                     onConfirm={onClose}
                     isDirty={form.formState.isDirty}
                  >
                     Cancel
                  </IButtonConfirm>
                  <IButton type='submit' variant='default'>
                     Update Expiration
                  </IButton>
               </div>
            </>
         )}
      </Form>
   );
}

import Modal from "@/components/custom/Modal";
import ITextarea from "@/components/custom/Textarea";
import InfoCard from "@/components/custom/InfoCard";
import Form from "@/components/custom/Form";
import { rejectStockApprovalSchema } from "@/lib/zod/schema/manageStock";
import { useWatch } from "react-hook-form";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";
import { useSelector } from "react-redux";

export default function RejectStockApproval({ isOpen, onClose, onSubmit }) {
   const { selectedStockApproval } = useSelector((state) => state.inventory);

   return (
      <Modal
         isOpen={isOpen}
         contentClassName='my-0'
         title='Reject Stock Request'
         description={`Provide a reason for rejecting stock request #${selectedStockApproval?.id || ""}`}
         size='md'
         primaryAction={null}
         secondaryAction={null}
         showFooter={false}
      >
         <Form
            className='flex flex-col'
            onSubmit={onSubmit}
            schema={rejectStockApprovalSchema}
            defaultValues={{
               id: selectedStockApproval?.id || null,
               rejection_reason: "",
            }}
         >
            {(form) => {
               const formValues = useWatch(form);

               return (
                  <>
                     <section className='space-y-3'>
                        <InfoCard
                           label='Product'
                           value={`${selectedStockApproval?.variant?.inventory?.name} - ${selectedStockApproval?.variant?.variant_name}`}
                           subtext={`SKU: ${selectedStockApproval?.variant?.inventory?.sku}`}
                        />

                        <InfoCard
                           label='Quantity'
                           value={`${selectedStockApproval?.quantity} ${selectedStockApproval?.variant?.inventory?.unit}`}
                           subtext={`From: ${selectedStockApproval?.supplier?.name || "Unknown Supplier"}`}
                        />

                        <InfoCard
                           label='Requested By'
                           value={selectedStockApproval?.requester?.full_name}
                           subtext={selectedStockApproval?.requester?.email}
                        />
                     </section>

                     <ITextarea
                        name='rejection_reason'
                        label='Rejection Reason'
                        placeholder='Please provide a detailed reason for rejection...'
                        rows={4}
                        required
                        wrapperClassName='mt-4'
                     />

                     <div className='flex items-center justify-end gap-2 mt-4'>
                        <IButtonConfirm
                           title='Cancel Rejection'
                           message='Are you sure you want to cancel? All unsaved changes will be lost.'
                           asButton
                           onConfirm={onClose}
                           isDirty={form.formState.isDirty}
                        >
                           Cancel
                        </IButtonConfirm>
                        <IButton type='submit' variant='destructive'>
                           Reject Approval
                        </IButton>
                     </div>
                  </>
               );
            }}
         </Form>
      </Modal>
   );
}

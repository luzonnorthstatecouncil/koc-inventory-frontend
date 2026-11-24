import Modal from "@/components/custom/Modal";
import ITextarea from "@/components/custom/Textarea";
import Form from "@/components/custom/Form";
import { rejectStockApprovalSchema } from "@/lib/zod/schema/manageStock";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";
import { useSelector } from "react-redux";
import { padwithZero } from "@/helpers/parser";

function Fact({ label, children }) {
   return (
      <div className='flex items-baseline justify-between gap-4'>
         <dt className='shrink-0 text-sm text-neutral-600'>{label}</dt>
         <dd className='min-w-0 truncate text-end text-sm font-medium text-foreground tabular-nums'>{children}</dd>
      </div>
   );
}

export default function RejectStockApproval({ isOpen, onClose, onSubmit }) {
   const { selectedStockApproval } = useSelector((state) => state.inventory);
   const inventory = selectedStockApproval?.variant?.inventory;
   const variant = selectedStockApproval?.variant?.variant_name;
   const isRemove = selectedStockApproval?.request_type === "remove";

   return (
      <Modal
         isOpen={isOpen}
         contentClassName='my-0'
         className='pb-0'
         title='Reject stock request'
         description={
            selectedStockApproval?.id
               ? `Request #${padwithZero(selectedStockApproval.id)}. The requester sees your reason.`
               : "The requester sees your reason."
         }
         size='md'
         primaryAction={null}
         secondaryAction={null}
         showFooter={false}
      >
         <Form
            className='flex flex-col gap-4'
            onSubmit={onSubmit}
            schema={rejectStockApprovalSchema}
            defaultValues={{
               id: selectedStockApproval?.id || null,
               rejection_reason: "",
            }}
         >
            {(form) => (
               <>
                  {/* What's being rejected */}
                  <section className='flex flex-col gap-1'>
                     <p className='text-2xl font-bold tracking-tight text-foreground tabular-nums'>
                        {isRemove ? "−" : "+"}
                        {Number(selectedStockApproval?.quantity || 0).toLocaleString()}{" "}
                        <span className='text-base font-medium text-neutral-500'>{inventory?.unit || "pcs"}</span>
                     </p>
                     <p className='text-sm text-foreground'>
                        <span className='font-semibold'>{inventory?.name || "Unknown item"}</span>
                        {variant && variant !== "Default" && <span className='text-neutral-500'> · {variant}</span>}
                     </p>
                     {inventory?.sku && <p className='text-xs text-neutral-500 tabular-nums'>{inventory.sku}</p>}
                  </section>

                  <dl className='flex flex-col gap-1.5 rounded-xl bg-neutral-50 px-4 py-3'>
                     <Fact label='Supplier'>{selectedStockApproval?.supplier?.name || "Unknown supplier"}</Fact>
                     <Fact label='Requested by'>{selectedStockApproval?.requester?.full_name || "—"}</Fact>
                  </dl>

                  <ITextarea
                     name='rejection_reason'
                     label='Reason'
                     placeholder='Please provide a detailed reason for rejection...'
                     rows={4}
                     required
                  />

                  <footer className='-mx-3 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                     <IButtonConfirm
                        title='Discard this rejection?'
                        message='The request stays pending.'
                        cancelLabel='Keep editing'
                        confirmLabel='Discard'
                        asButton
                        onConfirm={onClose}
                        isDirty={form.formState.isDirty}
                     >
                        Cancel
                     </IButtonConfirm>
                     <IButton type='submit' variant='destructive'>
                        Reject Approval
                     </IButton>
                  </footer>
               </>
            )}
         </Form>
      </Modal>
   );
}

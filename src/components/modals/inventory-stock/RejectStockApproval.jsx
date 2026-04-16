import Modal from "@/components/custom/Modal";
import ITextarea from "@/components/custom/Textarea";
import Form from "@/components/custom/Form";
import { rejectStockApprovalSchema } from "@/lib/zod/schema/manageStock";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";
import { useSelector } from "react-redux";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle, Package, Scale, User, Building2 } from "lucide-react";

export default function RejectStockApproval({ isOpen, onClose, onSubmit }) {
   const { selectedStockApproval } = useSelector((state) => state.inventory);

   const requesterName = selectedStockApproval?.requester?.full_name || "";
   const initials = requesterName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

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
                  {/* Warning Banner */}
                  <div className='flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3'>
                     <AlertTriangle className='mt-0.5 size-4 shrink-0 text-destructive' />
                     <p className='text-sm text-destructive leading-snug'>
                        This action will reject the stock request. The requester will be notified with your reason.
                     </p>
                  </div>

                  {/* Merged Details Card — receipt style */}
                  <div className='rounded-lg border border-outline overflow-hidden text-sm'>
                     <div className='flex items-center gap-3 px-4 py-2.5 bg-muted/40'>
                        <Package className='size-3.5 shrink-0 text-muted-foreground' />
                        <span className='text-xs text-muted-foreground w-24 shrink-0'>Product</span>
                        <div className='flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0'>
                           <span className='font-semibold truncate'>
                              {selectedStockApproval?.variant?.inventory?.name} —{" "}
                              {selectedStockApproval?.variant?.variant_name}
                           </span>
                           <Badge variant='muted' className='shrink-0'>
                              {selectedStockApproval?.variant?.inventory?.sku}
                           </Badge>
                        </div>
                     </div>

                     <Separator />

                     <div className='flex items-center gap-3 px-4 py-2.5'>
                        <Scale className='size-3.5 shrink-0 text-muted-foreground' />
                        <span className='text-xs text-muted-foreground w-24 shrink-0'>Quantity</span>
                        <span className='font-semibold'>
                           {selectedStockApproval?.quantity}{" "}
                           <span className='font-normal text-muted-foreground'>
                              {selectedStockApproval?.variant?.inventory?.unit}
                           </span>
                        </span>
                     </div>

                     <Separator />

                     <div className='flex items-center gap-3 px-4 py-2.5 bg-muted/40'>
                        <Building2 className='size-3.5 shrink-0 text-muted-foreground' />
                        <span className='text-xs text-muted-foreground w-24 shrink-0'>Supplier</span>
                        <span className='font-semibold'>
                           {selectedStockApproval?.supplier?.name || "Unknown Supplier"}
                        </span>
                     </div>

                     <Separator />

                     <div className='flex items-center gap-3 px-4 py-2.5'>
                        <Avatar className='size-5 shrink-0'>
                           <AvatarFallback className='bg-primary/10 text-[10px] font-semibold text-primary'>
                              {initials || <User className='size-3' />}
                           </AvatarFallback>
                        </Avatar>
                        <span className='text-xs text-muted-foreground w-24 shrink-0'>Requested By</span>
                        <div className='min-w-0'>
                           <span className='font-semibold'>{requesterName || "—"}</span>
                           <span className='text-muted-foreground ml-1.5 text-xs truncate'>
                              {selectedStockApproval?.requester?.email}
                           </span>
                        </div>
                     </div>
                  </div>

                  <ITextarea
                     name='rejection_reason'
                     label='Rejection Reason'
                     placeholder='Please provide a detailed reason for rejection...'
                     rows={4}
                     required
                  />

                  <div className='flex items-center justify-end gap-2'>
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
            )}
         </Form>
      </Modal>
   );
}

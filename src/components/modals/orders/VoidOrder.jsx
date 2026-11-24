import { TriangleAlert } from "lucide-react";
import Modal from "@/components/custom/Modal";
import Form from "@/components/custom/Form";
import ISelect from "@/components/custom/Select";
import ITextarea from "@/components/custom/Textarea";
import IButton from "@/components/custom/Button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { padwithZero, priceParser } from "@/helpers/parser";
import { VOID_REASONS_OPTIONS, voidOrderDefaultValues, voidOrderSchema } from "@/lib/zod/schema/voidOrder";
import { Note, OrderHeader, OrderLines } from "./ui/OrderParts";

/**
 * Void a sale: cancel it as if it was never rung up. For mistakes caught while the shift is
 * still open; a sale the customer brings back later is a refund instead.
 */
export default function VoidOrder({ isOpen, onClose, onConfirm, order }) {
   const submit = ({ id, reason, reason_details }) =>
      onConfirm({ id, reason: reason_details?.trim() ? `${reason}: ${reason_details.trim()}` : reason });

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         size='xl'
         contentClassName='my-0'
         className='pb-0'
         secondaryAction={null}
         primaryAction={null}
         title={`Void Order #${padwithZero(order?.id)}`}
      >
         <div className='flex flex-col gap-4'>
            <OrderHeader order={order} showStatus={false} />

            <Note tone='warning' icon={TriangleAlert} label='This cancels the whole sale'>
               {priceParser(order?.order_total)} comes out of the shift&apos;s cash and every item goes back into stock. Use
               it only for mistakes made during this shift; if the customer is returning items, refund them instead.
            </Note>

            <ScrollArea className='max-h-56'>
               <OrderLines items={order?.items ?? []} showKitContents={false} />
            </ScrollArea>
         </div>

         <Form
            className='mt-4 flex flex-col'
            onSubmit={submit}
            schema={voidOrderSchema}
            defaultValues={{ ...voidOrderDefaultValues, id: order?.id ?? null }}
         >
            {(form) => {
               const values = form.watch();
               return (
                  <>
                     <ISelect showAll={false} name='reason' label='Reason' placeholder='Select a reason' options={VOID_REASONS_OPTIONS} />
                     {values.reason === "Other" && (
                        <ITextarea name='reason_details' wrapperClassName='mt-4' label='Details' placeholder='e.g. Charged the wrong customer' />
                     )}
                     <div className='-mx-3 mt-4 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 py-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                        <IButton type='button' variant='outline' onClick={onClose}>
                           Keep sale
                        </IButton>
                        <IButton type='submit' variant='destructive'>
                           Void sale
                        </IButton>
                     </div>
                  </>
               );
            }}
         </Form>
      </Modal>
   );
}

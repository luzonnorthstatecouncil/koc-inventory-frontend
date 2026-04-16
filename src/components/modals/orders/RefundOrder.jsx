import Each from "@/components/custom/Each";
import Modal from "@/components/custom/Modal";
import { padwithZero, priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useSelector } from "react-redux";
import OrderItem from "./ui/OrderItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import ISelect from "@/components/custom/Select";
import { REFUND_REASONS_OPTIONS } from "@/constants/options";
import ITextarea from "@/components/custom/Textarea";
import Form from "@/components/custom/Form";
import { refundOrderDefaultValues, refundOrderSchema } from "@/lib/zod/schema/refundOrder";
import { useWatch } from "react-hook-form";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";

export default function RefundOrder({ isOpen, onClose, onConfirm }) {
   const { selectedOrder } = useSelector((state) => state.order);

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         contentClassName='my-0'
         className='pb-0'
         secondaryAction={null}
         primaryAction={null}
         title={`Refund Order #${padwithZero(selectedOrder?.id)}`}
      >
         {/* Ref number banner */}
         <div className='flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2 mb-4'>
            <RefreshCcw className='size-3.5 text-primary flex-shrink-0' />
            <span className='font-mono text-xs font-semibold text-primary tracking-wider'>{selectedOrder?.order_number}</span>
         </div>

         {/* Warning alert */}
         <div className='flex gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4'>
            <AlertTriangle className='size-4 text-red-500 flex-shrink-0 mt-0.5' />
            <p className='text-xs text-red-700 leading-relaxed'>
               Refunding this order will create a refund record and update the order status accordingly. This will also
               automatically adjust the inventory stocks for the refunded items and void the payment associated with this
               order.
            </p>
         </div>

         {/* Items */}
         <p className='text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2'>Items</p>
         <ScrollArea className='h-32 mb-3'>
            <div className='rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-0.5'>
               <Each
                  of={selectedOrder?.items}
                  render={(item) => (
                     <OrderItem
                        key={item.id}
                        name={`${item.product.inventory.name} - ${item.product.variant_name}`}
                        quantity={item.quantity !== 0 ? item.quantity : null}
                        price={item.product.inventory.price}
                     />
                  )}
               />
            </div>
         </ScrollArea>

         {/* Total refund amount */}
         <div className='rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-3 mb-4'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Amount to Refund</p>
            <p className={cn("text-xl font-extrabold tabular-nums", Number(selectedOrder?.order_total) <= 0 ? "text-destructive" : "text-foreground")}>
               {priceParser(selectedOrder?.order_total)}
            </p>
         </div>

         <Form
            className='flex flex-col'
            onSubmit={onConfirm}
            schema={refundOrderSchema}
            defaultValues={{
               ...refundOrderDefaultValues,
               id: selectedOrder?.id || null,
            }}
         >
            {(form) => {
               const formValues = useWatch(form);

               return (
                  <>
                     <ISelect
                        showAll={false}
                        name='reason'
                        label='Why are you refunding this order?'
                        placeholder='Select a reason'
                        options={REFUND_REASONS_OPTIONS}
                     />

                     {formValues.reason && formValues.reason === "Other" && (
                        <ITextarea
                           name='reason_details'
                           wrapperClassName='mt-4'
                           label='Please provide additional details for the refund:'
                           placeholder='e.g. Customer requested a refund due to...'
                        />
                     )}

                     <div className='flex items-center justify-end gap-2 mt-4'>
                        <IButtonConfirm
                           title='Cancel Editing'
                           message='Are you sure you want to cancel? All unsaved changes will be lost.'
                           asButton
                           onConfirm={onClose}
                        >
                           Cancel
                        </IButtonConfirm>
                        <IButton type='submit' variant='default'>
                           Save Changes
                        </IButton>
                     </div>
                  </>
               );
            }}
         </Form>
      </Modal>
   );
}


import Details from "@/components/custom/Details";
import Each from "@/components/custom/Each";
import Modal from "@/components/custom/Modal";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { dateParser, padwithZero } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { Barcode } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import OrderItem from "./ui/OrderItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCallback, useState } from "react";
import ISelect from "@/components/custom/Select";
import { REFUND_REASONS_OPTIONS } from "@/constants/options";
import { setOrderRefundDetails, setOrderRefundReason } from "@/features/slice/orderSlice";
import ITextarea from "@/components/custom/Textarea";
import { toast } from "sonner";
import Form from "@/components/custom/Form";
import { refundOrderDefaultValues, refundOrderSchema } from "@/lib/zod/schema/refundOrder";
import { useWatch } from "react-hook-form";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";

export default function RefundOrder({ isOpen, onClose, onConfirm }) {
   const dispatch = useDispatch();
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
         description={<Paragraph>Reference Number: {selectedOrder?.order_number}</Paragraph>}
      >
         <Paragraph className='bg-red-100 text-secondary border border-secondary p-3 rounded-md text-sm'>
            Refunding this order will create a refund record and update the order status accordingly. This will also
            automatically adjust the inventory stocks for the refunded items and void the payment associated with this
            order.
         </Paragraph>

         <Separator className='my-3' />

         <ScrollArea className='space-y-1 pb-2 h-30'>
            <Paragraph>Items</Paragraph>
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
         </ScrollArea>

         <section className='p-3 rounded-lg bg-gray-200 space-y-0.5 mt-3'>
            <article className='flex items-center justify-between gap-3'>
               <Paragraph size='sm' className='text-black'>
                  Amount to Refund
               </Paragraph>
               <Title className={Number(selectedOrder?.order_total) <= 0 ? "!text-destructive" : "!text-black"}>
                  PHP {selectedOrder?.order_total}
               </Title>
            </article>
         </section>

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
                        className='mt-4'
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

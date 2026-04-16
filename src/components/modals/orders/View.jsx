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
import { setSelectedOrder } from "@/features/slice/orderSlice";
import { useState } from "react";

export default function ViewOrder({ isOpen, onClose }) {
   const dispatch = useDispatch();
   const [tempOrder, setTempOrder] = useState(null);
   const { selectedOrder } = useSelector((state) => state.order);

   const onViewRefundedOrder = () => {
      setTempOrder(selectedOrder);
      dispatch(setSelectedOrder(selectedOrder.refundedOrder));
   };

   const onViewRefundOrder = () => {
      setTempOrder(null);
      dispatch(setSelectedOrder(tempOrder));
   };

   const refundedOrder = selectedOrder.refundedOrder;
   const isOrderRefunded = Boolean(refundedOrder);

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         contentClassName='my-0'
         isLoading={!selectedOrder}
         secondaryAction={
            isOrderRefunded
               ? {
                    label: "Close",
                    onCancel: () => {
                       setTempOrder(null);
                       onClose();
                    },
                 }
               : null
         }
         primaryAction={
            isOrderRefunded
               ? {
                    label: "View Original Order",
                    autoClose: false,
                    onConfirm: onViewRefundedOrder,
                 }
               : tempOrder
                 ? {
                      label: "View Refund Order",
                      autoClose: false,
                      onConfirm: onViewRefundOrder,
                   }
                 : {
                      label: "Close",
                      onConfirm: onClose,
                   }
         }
         title={`Order #${padwithZero(selectedOrder?.id)}`}
         description={<Paragraph>Date Ordered: {dateParser(selectedOrder?.created_at)}</Paragraph>}
      >
         <ScrollArea className='max-h-120'>
            <Details
               label='Order Number'
               labelClassName='text-white'
               className='mb-2 bg-primary rounded-md py-2 px-3'
               description={
                  <span className='flex items-center justify-between gap-1 font-medium font-mono text-lg'>
                     <span className='flex items-center gap-1 text-primary-foreground!'>
                        <Barcode className='size-5' /> {selectedOrder?.order_number}
                     </span>
                     {Boolean(selectedOrder.is_refund) && <Badge variant='warning'>Refunded Order</Badge>}
                  </span>
               }
            />

            {selectedOrder?.refund_reason && (
               <Details label='Refund Reason' description={selectedOrder?.refund_reason} />
            )}

            <section className='space-y-1 py-2'>
               <Paragraph>Items</Paragraph>
               <Each
                  of={selectedOrder?.items}
                  render={(item) => (
                     <OrderItem
                        key={item.id}
                        name={`${item.product?.inventory?.name} - ${item.product.variant_name}`}
                        quantity={item.quantity !== 0 ? item.quantity : null}
                        price={item.product.inventory?.price}
                     />
                  )}
               />

               <Separator className='mt-2 mb-3' />

               <OrderItem
                  name='Transaction Ref'
                  parsePrice={false}
                  price={selectedOrder?.payments.transaction_reference}
                  nameClassName='font-normal'
               />
               <OrderItem
                  name='Amount Tendered'
                  price={selectedOrder?.payments.amount_tendered}
                  nameClassName='font-normal'
               />
               <OrderItem name='Subtotal' price={selectedOrder.subtotal} nameClassName='font-normal' />
               <OrderItem name='Change' price={selectedOrder?.payments.change_given} nameClassName='font-normal' />
            </section>

            <section className='p-3 rounded-lg bg-gray-200 mt-4 space-y-0.5'>
               <article className='flex items-center justify-between gap-3'>
                  <Badge
                     className={cn(
                        "flex items-center gap-1",
                        selectedOrder?.payments.status === "Completed"
                           ? "text-green-600 border-green-600 font-semibold"
                           : "text-yellow-600 border-yellow-600",
                     )}
                     variant='outline'
                  >
                     {selectedOrder?.payments.status} via
                     <span className='capitalize'>{selectedOrder?.payments.payment_method}</span>
                  </Badge>
                  <Title className={Number(selectedOrder?.order_total) <= 0 ? "!text-destructive" : "!text-black"}>
                     PHP {selectedOrder?.order_total}
                  </Title>
               </article>
            </section>
         </ScrollArea>
      </Modal>
   );
}

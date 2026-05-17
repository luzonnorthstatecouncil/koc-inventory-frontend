import Each from "@/components/custom/Each";
import Modal from "@/components/custom/Modal";
import { Separator } from "@/components/ui/separator";
import { dateParser, padwithZero, priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { Banknote, Barcode, CalendarDays, CreditCard, RefreshCcw, ShoppingBag } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import OrderItem from "./ui/OrderItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { setSelectedOrder } from "@/features/slice/orderSlice";
import { useState } from "react";

const PAYMENT_METHOD_ICONS = {
   cash: Banknote,
   card: CreditCard,
   gcash: ShoppingBag,
};

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
   const isCompleted = selectedOrder?.payments?.status === "Completed";
   const PayIcon =
      PAYMENT_METHOD_ICONS[selectedOrder?.payments?.payment_method?.toLowerCase()] ?? CreditCard;

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
               ? { label: "View Original Order", autoClose: false, onConfirm: onViewRefundedOrder }
               : tempOrder
                 ? { label: "View Refund Order", autoClose: false, onConfirm: onViewRefundOrder }
                 : { label: "Close", onConfirm: onClose }
         }
         title={`Order #${padwithZero(selectedOrder?.id)}`}
      >
         <ScrollArea className='max-h-120'>
            {/* Order ref banner */}
            <div className='flex items-center justify-between gap-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 mb-4'>
               <div className='flex items-center gap-2 min-w-0'>
                  <Barcode className='size-4 text-primary flex-shrink-0' />
                  <span className='font-mono font-bold text-sm text-foreground tracking-wider truncate'>
                     {selectedOrder?.order_number}
                  </span>
               </div>
               <div className='flex items-center gap-2 flex-shrink-0'>
                  <CalendarDays className='size-3.5 text-muted-foreground' />
                  <span className='text-xs text-muted-foreground'>
                     {dateParser(selectedOrder?.created_at)}
                  </span>
               </div>
            </div>

            {/* Refund badge */}
            {Boolean(selectedOrder?.is_refund) && (
               <div className='flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 mb-3 text-xs font-semibold'>
                  <RefreshCcw className='size-3.5' /> Refunded Order
               </div>
            )}

            {selectedOrder?.refund_reason && (
               <div className='bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4'>
                  <p className='text-sm font-semibold text-red-500 uppercase tracking-wide mb-0.5'>
                     Refund Reason
                  </p>
                  <p className='text-xs text-red-700'>{selectedOrder?.refund_reason}</p>
               </div>
            )}

            {/* Items */}
            <p className='text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
               Items
            </p>
            <div className='space-y-1 rounded-xl border border-gray-100 bg-gray-50/50 p-3 mb-3'>
               <Each
                  of={selectedOrder?.items}
                  render={(item) => {
                     const isKit = Boolean(item.kit_id);
                     const itemName = isKit
                        ? item.kit?.name || "Unknown Kit"
                        : `${item.product?.inventory?.name || "Unknown Item"} - ${item.product?.variant_name || "N/A"}`;

                     return (
                        <div key={item.id} className='flex flex-col'>
                           <OrderItem
                              name={itemName}
                              quantity={item.quantity !== 0 ? item.quantity : null}
                              price={isKit ? item.kit?.price : item.product?.inventory?.price}
                              nameClassName={isKit ? "font-bold text-primary" : ""}
                           />
                           {isKit &&
                              item.kit?.items?.map((kitItem) => (
                                 <OrderItem
                                    key={`${item.id}-${kitItem.id}`}
                                    name={`${kitItem.variant?.inventory?.name || "Component"} - ${kitItem.variant?.variant_name || "N/A"}`}
                                    quantity={kitItem.quantity * item.quantity}
                                    className='pl-8 border-l-2 border-primary/10 ml-2.5 py-1'
                                    parsePrice={false}
                                    price=''
                                    nameClassName='text-muted-foreground text-xs'
                                 />
                              ))}
                        </div>
                     );
                  }}
               />
            </div>

            {/* Payment breakdown */}
            <p className='text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
               Payment Breakdown
            </p>
            <div className='rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-1.5 mb-4'>
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
               <OrderItem
                  name='Subtotal'
                  price={selectedOrder?.subtotal}
                  nameClassName='font-normal'
               />
               <OrderItem
                  name='Change'
                  price={selectedOrder?.payments.change_given}
                  nameClassName='font-normal'
               />
            </div>

            {/* Total footer */}
            <div className='rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-3'>
               <div className='flex items-center gap-2'>
                  <div
                     className={cn(
                        "p-1.5 rounded-lg",
                        isCompleted ? "bg-emerald-50" : "bg-amber-50",
                     )}
                  >
                     <PayIcon
                        className={cn(
                           "size-3.5",
                           isCompleted ? "text-emerald-600" : "text-amber-600",
                        )}
                     />
                  </div>
                  <div>
                     <p className='text-xs font-semibold text-foreground capitalize'>
                        {selectedOrder?.payments.payment_method}
                     </p>
                     <p
                        className={cn(
                           "text-xs font-semibold",
                           isCompleted ? "text-emerald-600" : "text-amber-600",
                        )}
                     >
                        {selectedOrder?.payments.status}
                     </p>
                  </div>
               </div>
               <p
                  className={cn(
                     "text-xl font-extrabold tabular-nums",
                     Number(selectedOrder?.order_total) <= 0
                        ? "text-destructive"
                        : "text-foreground",
                  )}
               >
                  {priceParser(selectedOrder?.order_total)}
               </p>
            </div>
         </ScrollArea>
      </Modal>
   );
}

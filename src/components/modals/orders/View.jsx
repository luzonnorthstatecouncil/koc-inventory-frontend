import Modal from "@/components/custom/Modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dateParser, padwithZero, priceParser } from "@/helpers/parser";
import { describeOrderItem } from "@/helpers/orderItems";
import { orderStatus } from "@/helpers/orderStatus";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Note } from "./ui/OrderParts";

function SectionHeading({ children }) {
   return <h3 className='text-xs font-semibold text-neutral-500'>{children}</h3>;
}

function Line({ label, value, strong, muted, valueClassName }) {
   return (
      <div className='flex items-baseline justify-between gap-4'>
         <dt className={cn("text-sm", strong ? "font-semibold text-foreground" : muted ? "text-neutral-500" : "text-neutral-700")}>
            {label}
         </dt>
         <dd
            className={cn(
               "tabular-nums",
               strong ? "text-base font-bold text-foreground" : muted ? "text-sm text-neutral-500" : "text-sm font-medium text-foreground",
               valueClassName,
            )}
         >
            {value}
         </dd>
      </div>
   );
}

// order / onSelectOrder come from the Orders page (onSelectOrder switches between a refund and its original)
export default function ViewOrder({ isOpen, onClose, order: selectedOrder, onSelectOrder }) {
   const [tempOrder, setTempOrder] = useState(null);

   const onViewRefundedOrder = () => {
      setTempOrder(selectedOrder);
      onSelectOrder(selectedOrder.refundedOrder);
   };

   const onViewRefundOrder = () => {
      setTempOrder(null);
      onSelectOrder(tempOrder);
   };

   // On a refund order, refundedOrder is the sale it refunds
   const refundedOrder = selectedOrder.refundedOrder;
   const isOrderRefunded = Boolean(refundedOrder);
   const isRefundOrder = Boolean(selectedOrder?.refunded_order_id);
   const status = orderStatus(selectedOrder);
   const payment = selectedOrder?.payments ?? {};
   const total = Number(selectedOrder?.order_total ?? 0);
   const items = selectedOrder?.items ?? [];

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         size='lg'
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
               ? { label: "View original sale", autoClose: false, onConfirm: onViewRefundedOrder }
               : tempOrder
                 ? { label: "Back to refund", autoClose: false, onConfirm: onViewRefundOrder }
                 : { label: "Close", onConfirm: onClose }
         }
         title={`${isRefundOrder ? "Refund" : "Order"} #${padwithZero(selectedOrder?.id)}`}
      >
         <ScrollArea className='max-h-[70vh]'>
            <div className='flex flex-col gap-5 pr-1'>
               {/* What happened, how much, when */}
               <section className='flex flex-col gap-1'>
                  <p className={cn("inline-flex items-center gap-2 text-sm font-medium", status.text)}>
                     <span className={cn("size-2 rounded-full", status.dot)} aria-hidden='true' />
                     {status.label}
                  </p>
                  <p className={cn("text-3xl font-bold tracking-tight tabular-nums", total < 0 ? "text-red-700" : "text-foreground")}>
                     {priceParser(total)}
                  </p>
                  <p className='text-sm text-neutral-500 tabular-nums'>
                     {selectedOrder?.created_at &&
                        `${dateParser(selectedOrder.created_at, "PP")} · ${dateParser(selectedOrder.created_at, "p")}`}
                     {payment.payment_method && <span className='capitalize'> · {payment.payment_method}</span>}
                  </p>
                  {isRefundOrder && refundedOrder?.order_number && (
                     <p className='text-sm text-neutral-600'>
                        Refund of sale <span className='font-medium text-foreground tabular-nums'>{refundedOrder.order_number}</span>
                     </p>
                  )}
               </section>

               {selectedOrder?.status === "voided" && (
                  <Note label='Void reason'>
                     <p>{selectedOrder.void_reason || "No reason recorded"}</p>
                     {(selectedOrder.voidedBy?.full_name || selectedOrder.voided_at) && (
                        <p className='text-xs text-neutral-500 tabular-nums'>
                           {selectedOrder.voidedBy?.full_name && `By ${selectedOrder.voidedBy.full_name}`}
                           {selectedOrder.voidedBy?.full_name && selectedOrder.voided_at && " · "}
                           {selectedOrder.voided_at &&
                              `${dateParser(selectedOrder.voided_at, "PP")} ${dateParser(selectedOrder.voided_at, "p")}`}
                        </p>
                     )}
                  </Note>
               )}

               {selectedOrder?.refund_reason && (
                  <Note label='Refund reason'>
                     <p>{selectedOrder.refund_reason}</p>
                  </Note>
               )}

               {/* Items, receipt-style */}
               <section className='flex flex-col gap-2'>
                  <SectionHeading>
                     {items.length} {items.length === 1 ? "item" : "items"}
                  </SectionHeading>
                  <ul className='divide-y divide-neutral-100 border-y border-neutral-200'>
                     {items.map((item) => {
                        const line = describeOrderItem(item);
                        const qty = Number(item.quantity) || 0;
                        const variant = line.isKit
                           ? "Kit"
                           : line.variantName && line.variantName !== "Default"
                             ? line.variantName
                             : null;
                        return (
                           <li key={item.id} className='flex items-start justify-between gap-4 py-3'>
                              <div className='flex min-w-0 flex-col gap-0.5'>
                                 <p className='text-sm font-medium text-foreground'>
                                    <span className='tabular-nums'>{qty} ×</span> {line.name}
                                 </p>
                                 <p className='text-xs text-neutral-500 tabular-nums'>
                                    {variant && `${variant} · `}
                                    {priceParser(line.price)} each
                                 </p>
                                 {item.returned_quantity > 0 && (
                                    <p className='text-xs font-medium text-amber-700 tabular-nums'>
                                       {item.returned_quantity} of {qty} returned
                                    </p>
                                 )}
                                 {line.isKit && item.kit?.items?.length > 0 && (
                                    <ul className='mt-1 flex flex-col gap-0.5 border-l border-neutral-200 pl-3'>
                                       {item.kit.items.map((kitItem) => (
                                          <li key={kitItem.id} className='text-xs text-neutral-500 tabular-nums'>
                                             {kitItem.quantity * qty} × {kitItem.variant?.inventory?.name || "Component"}
                                             {kitItem.variant?.variant_name && kitItem.variant.variant_name !== "Default"
                                                ? ` · ${kitItem.variant.variant_name}`
                                                : ""}
                                          </li>
                                       ))}
                                    </ul>
                                 )}
                              </div>
                              <p className='shrink-0 text-sm font-medium text-foreground tabular-nums'>
                                 {priceParser(line.price * qty)}
                              </p>
                           </li>
                        );
                     })}
                  </ul>

                  {/* Totals continue the receipt */}
                  <dl className='flex flex-col gap-1.5 pt-1'>
                     <Line label='Subtotal' value={priceParser(selectedOrder?.subtotal)} muted />
                     <Line
                        label={isRefundOrder ? "Refunded" : "Total"}
                        value={priceParser(total)}
                        strong
                        valueClassName={total < 0 ? "text-red-700" : undefined}
                     />
                     {!isRefundOrder && (
                        <>
                           <Line label='Cash received' value={priceParser(payment.amount_tendered)} muted />
                           <Line label='Change' value={priceParser(payment.change_given)} muted />
                        </>
                     )}
                  </dl>
               </section>

               {/* Reference numbers, for looking the sale up later */}
               <section className='flex flex-col gap-2 rounded-xl bg-neutral-50 px-4 py-3'>
                  <SectionHeading>Details</SectionHeading>
                  <dl className='flex flex-col gap-1.5'>
                     <Line label='Order no.' value={selectedOrder?.order_number || "—"} />
                     {selectedOrder?.invoice_number && <Line label='Invoice no.' value={selectedOrder.invoice_number} />}
                     <Line label='Payment reference' value={payment.transaction_reference || "—"} />
                  </dl>
               </section>
            </div>
         </ScrollArea>
      </Modal>
   );
}

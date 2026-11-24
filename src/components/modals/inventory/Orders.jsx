import { useMemo, useState } from "react";
import ModalSkeleton from "@/components/custom/ModalSkeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dateParser, padwithZero, priceParser } from "@/helpers/parser";
import { describeOrderItem } from "@/helpers/orderItems";
import { cn } from "@/lib/utils";
// Shared with the Transactions table, so a status reads the same everywhere.
import { orderStatus } from "@/helpers/orderStatus";

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Quick ranges, measured from local midnight so "Today" means the calendar day. */
const DATE_RANGES = [
   { key: "all", label: "All", from: () => null },
   { key: "today", label: "Today", from: (now) => startOfDay(now) },
   {
      key: "7d",
      label: "7 days",
      from: (now) => new Date(startOfDay(now).getTime() - 6 * 86_400_000),
   },
   {
      key: "30d",
      label: "30 days",
      from: (now) => new Date(startOfDay(now).getTime() - 29 * 86_400_000),
   },
   {
      key: "month",
      label: "This month",
      from: (now) => new Date(now.getFullYear(), now.getMonth(), 1),
   },
];

export default function Orders({ item: orders, isLoading }) {
   const [selected, setSelected] = useState(0);
   const [range, setRange] = useState("all");

   const filtered = useMemo(() => {
      const from = DATE_RANGES.find((r) => r.key === range)?.from(new Date());
      if (!from) return orders ?? [];
      return (orders ?? []).filter((o) => new Date(o.created_at) >= from);
   }, [orders, range]);

   if (isLoading) return <ModalSkeleton />;

   if (!orders || orders.length === 0) {
      return (
         <div className='flex min-h-40 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-200 text-center'>
            <p className='text-sm font-semibold text-foreground'>No orders yet</p>
            <p className='text-sm text-neutral-500'>Sales that include this item will appear here.</p>
         </div>
      );
   }

   const order = filtered[Math.min(selected, filtered.length - 1)];
   const pickRange = (key) => {
      setRange(key);
      setSelected(0);
   };

   return (
      <div className='flex flex-col gap-4'>
         <div role='radiogroup' aria-label='Order date' className='flex flex-wrap gap-1.5'>
            {DATE_RANGES.map((r) => {
               const active = r.key === range;
               return (
                  <button
                     key={r.key}
                     type='button'
                     role='radio'
                     aria-checked={active}
                     onClick={() => pickRange(r.key)}
                     className={cn(
                        "h-8 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                        active
                           ? "border-primary bg-primary text-white"
                           : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
                     )}
                  >
                     {r.label}
                  </button>
               );
            })}
         </div>

         {filtered.length === 0 ? (
            <div className='flex min-h-80 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-200 text-center'>
               <p className='text-sm font-semibold text-foreground'>No orders in this range</p>
               <p className='text-sm text-neutral-500'>
                  {orders.length} {orders.length === 1 ? "order" : "orders"} in total.{" "}
                  <button
                     type='button'
                     onClick={() => pickRange("all")}
                     className='font-medium text-primary underline-offset-2 hover:underline'
                  >
                     Show all
                  </button>
               </p>
            </div>
         ) : (
            <div className='grid min-h-96 grid-cols-1 gap-4 sm:grid-cols-[15rem_minmax(0,1fr)]'>
               <nav aria-label='Orders' className='flex flex-col gap-2 sm:border-r sm:border-neutral-200 sm:pr-4'>
                  <p className='text-xs font-semibold text-neutral-500'>
                     {filtered.length} {filtered.length === 1 ? "order" : "orders"}
                  </p>
                  <ScrollArea className='max-h-40 sm:max-h-[60vh]'>
                     <ul className='flex flex-col gap-0.5 pr-2'>
                        {filtered.map((o, index) => {
                           const active = index === selected;
                           return (
                              <li key={o.id ?? index}>
                                 <button
                                    type='button'
                                    aria-current={active ? "true" : undefined}
                                    onClick={() => setSelected(index)}
                                    className={cn(
                                       "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                                       active ? "bg-primary/[0.07]" : "hover:bg-neutral-100",
                                    )}
                                 >
                                    <span className='flex min-w-0 flex-col gap-0.5'>
                                       <span
                                          className={cn(
                                             "text-sm font-medium tabular-nums",
                                             active ? "font-semibold text-primary" : "text-foreground",
                                          )}
                                       >
                                          #{padwithZero(o.id)}
                                       </span>
                                       <span className='text-xs text-neutral-500'>
                                          {dateParser(o.created_at, "PP")}
                                       </span>
                                    </span>
                                    <span className='shrink-0 text-xs font-medium text-neutral-700 tabular-nums'>
                                       {priceParser(o.order_total)}
                                    </span>
                                 </button>
                              </li>
                           );
                        })}
                     </ul>
                  </ScrollArea>
               </nav>

               <OrderContent order={order} />
            </div>
         )}
      </div>
   );
}

function SummaryRow({ label, value, strong }) {
   return (
      <div className='flex items-baseline justify-between gap-4'>
         <dt className={strong ? "text-sm font-semibold text-foreground" : "text-sm text-neutral-600"}>{label}</dt>
         <dd
            className={cn(
               "tabular-nums",
               strong ? "text-lg font-bold text-foreground" : "text-sm font-medium text-foreground",
            )}
         >
            {value}
         </dd>
      </div>
   );
}

function OrderContent({ order }) {
   if (!order) return <p className='text-sm text-neutral-500'>No order data available.</p>;

   const status = orderStatus(order);
   const payment = order.payments ?? {};
   const lines = order.items ?? [];

   return (
      <article className='flex min-w-0 flex-col gap-4'>
         <header className='flex flex-wrap items-start justify-between gap-3'>
            <div className='flex min-w-0 flex-col gap-0.5'>
               <h3 className='text-lg font-semibold text-foreground tabular-nums'>Order #{padwithZero(order.id)}</h3>
               <p className='text-sm text-neutral-500 tabular-nums'>
                  {order.order_number}
                  {order.invoice_number && <> · Invoice {order.invoice_number}</>}
               </p>
            </div>
            <div className='flex flex-col items-end gap-0.5'>
               <span className={cn("inline-flex items-center gap-2 text-sm font-medium", status.text)}>
                  <span className={cn("size-2 rounded-full", status.dot)} aria-hidden='true' />
                  {status.label}
               </span>
               <span className='text-xs text-neutral-500 tabular-nums'>
                  {dateParser(order.created_at, "PP")} · {dateParser(order.created_at, "p")}
               </span>
            </div>
         </header>

         <section className='rounded-xl border border-neutral-200'>
            <div className='grid grid-cols-[minmax(0,1fr)_6rem_7rem] gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-500'>
               <span>
                  {lines.length} {lines.length === 1 ? "item" : "items"}
               </span>
               <span className='text-end'>Unit price</span>
               <span className='text-end'>Amount</span>
            </div>
            <ScrollArea className='max-h-[40vh]'>
               <ul className='divide-y divide-neutral-100'>
                  {lines.map((orderItem, index) => {
                     const line = describeOrderItem(orderItem);
                     const qty = Number(orderItem.quantity) || 0;
                     return (
                        <li
                           key={orderItem.id ?? index}
                           className='grid grid-cols-[minmax(0,1fr)_6rem_7rem] items-center gap-3 px-4 py-3'
                        >
                           <div className='flex min-w-0 items-center gap-3'>
                              <span className='flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 px-1.5 text-xs font-semibold text-foreground tabular-nums'>
                                 {qty}×
                              </span>
                              <div className='flex min-w-0 flex-col gap-0.5'>
                                 <span className='truncate text-sm font-medium text-foreground'>{line.name}</span>
                                 <span className='truncate text-xs text-neutral-500'>
                                    {line.isKit
                                       ? "Kit"
                                       : line.variantName && line.variantName !== "Default"
                                         ? line.variantName
                                         : "Standard"}
                                 </span>
                              </div>
                           </div>
                           <span className='text-end text-sm text-neutral-600 tabular-nums'>
                              {priceParser(line.price)}
                           </span>
                           <span className='text-end text-sm font-medium text-foreground tabular-nums'>
                              {priceParser(line.price * qty)}
                           </span>
                        </li>
                     );
                  })}
               </ul>
            </ScrollArea>
         </section>

         <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <dl className='flex flex-col gap-2 rounded-xl border border-neutral-200 p-4'>
               <div className='flex items-baseline justify-between gap-4'>
                  <dt className='text-sm text-neutral-600'>Payment</dt>
                  <dd className='text-sm font-medium text-foreground capitalize'>{payment.payment_method || "—"}</dd>
               </div>
               <div className='flex items-baseline justify-between gap-4'>
                  <dt className='text-sm text-neutral-600'>Reference</dt>
                  <dd className='truncate text-sm font-medium text-foreground tabular-nums'>
                     {payment.transaction_reference || "—"}
                  </dd>
               </div>
            </dl>

            <dl className='flex flex-col gap-2 rounded-xl border border-neutral-200 p-4'>
               <SummaryRow label='Subtotal' value={priceParser(order.subtotal)} />
               <SummaryRow label='Cash received' value={priceParser(payment.amount_tendered)} />
               <SummaryRow label='Change' value={priceParser(payment.change_given)} />
               <div className='mt-1 border-t border-neutral-200 pt-2'>
                  <SummaryRow label='Total' value={priceParser(order.order_total)} strong />
               </div>
            </dl>
         </div>
      </article>
   );
}

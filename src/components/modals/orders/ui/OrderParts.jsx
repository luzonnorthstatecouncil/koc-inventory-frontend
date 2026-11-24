import { dateParser, priceParser } from "@/helpers/parser";
import { describeOrderItem } from "@/helpers/orderItems";
import { orderStatus } from "@/helpers/orderStatus";
import { cn } from "@/lib/utils";

/** Order number, invoice and date on the left; status on the right. Same in every order modal. */
export function OrderHeader({ order, showStatus = true }) {
   const status = orderStatus(order);
   return (
      <header className='flex flex-wrap items-start justify-between gap-3'>
         <div className='flex min-w-0 flex-col gap-0.5'>
            <p className='text-sm font-semibold text-foreground tabular-nums'>
               {order?.order_number}
               {order?.invoice_number && <span className='font-medium text-neutral-500'> · Invoice {order.invoice_number}</span>}
            </p>
            <p className='text-xs text-neutral-500 tabular-nums'>
               {order?.created_at && `${dateParser(order.created_at, "PP")} · ${dateParser(order.created_at, "p")}`}
            </p>
         </div>
         {showStatus && (
            <span className={cn("inline-flex items-center gap-2 text-sm font-medium", status.text)}>
               <span className={cn("size-2 rounded-full", status.dot)} aria-hidden='true' />
               {status.label}
            </span>
         )}
      </header>
   );
}

/** A labelled note (void reason, refund reason, warnings). Neutral unless `tone` says otherwise. */
export function Note({ label, children, tone = "neutral", icon: Icon }) {
   const tones = {
      neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
      warning: "border-amber-200 bg-amber-50 text-amber-900",
   };
   return (
      <div className={cn("flex gap-2.5 rounded-xl border px-3.5 py-3", tones[tone])}>
         {Icon && <Icon className='mt-0.5 size-4 shrink-0 opacity-70' aria-hidden='true' />}
         <div className='flex min-w-0 flex-col gap-0.5'>
            {label && <p className='text-xs font-semibold'>{label}</p>}
            <div className='text-sm leading-relaxed'>{children}</div>
         </div>
      </div>
   );
}

/**
 * The lines of an order as sold: quantity, name and variant (or kit contents), unit price and amount.
 * `renderSide(item, line)` replaces the amount column (the refund modal puts its stepper there).
 */
export function OrderLines({ items = [], renderSide, showKitContents = true, label }) {
   return (
      <section className='rounded-xl border border-neutral-200'>
         <div className='flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-500'>
            <span>{label ?? `${items.length} ${items.length === 1 ? "item" : "items"}`}</span>
            {!renderSide && <span>Amount</span>}
         </div>
         <ul className='divide-y divide-neutral-100'>
            {items.map((item) => {
               const line = describeOrderItem(item);
               const qty = Number(item.quantity) || 0;
               return (
                  <li key={item.id} className='flex items-center justify-between gap-4 px-4 py-3'>
                     <div className='flex min-w-0 items-start gap-3'>
                        <span className='flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 px-1.5 text-xs font-semibold text-foreground tabular-nums'>
                           {qty}×
                        </span>
                        <div className='flex min-w-0 flex-col gap-0.5'>
                           <span className='truncate text-sm font-medium text-foreground'>{line.name}</span>
                           <span className='truncate text-xs text-neutral-500 tabular-nums'>
                              {line.isKit ? "Kit" : line.variantName && line.variantName !== "Default" ? line.variantName : "Standard"} ·{" "}
                              {priceParser(line.price)} each
                           </span>
                           {item.returned_quantity > 0 && (
                              <span className='text-xs font-medium text-amber-700 tabular-nums'>
                                 {item.returned_quantity} of {qty} returned
                              </span>
                           )}
                           {showKitContents && line.isKit && item.kit?.items?.length > 0 && (
                              <ul className='mt-1 flex flex-col gap-0.5 border-l border-neutral-200 pl-3'>
                                 {item.kit.items.map((kitItem) => (
                                    <li key={kitItem.id} className='text-xs text-neutral-500 tabular-nums'>
                                       {kitItem.quantity * qty}× {kitItem.variant?.inventory?.name || "Component"}
                                       {kitItem.variant?.variant_name && kitItem.variant.variant_name !== "Default"
                                          ? ` · ${kitItem.variant.variant_name}`
                                          : ""}
                                    </li>
                                 ))}
                              </ul>
                           )}
                        </div>
                     </div>
                     {renderSide ? (
                        renderSide(item, line)
                     ) : (
                        <span className='shrink-0 text-sm font-medium text-foreground tabular-nums'>
                           {priceParser(line.price * qty)}
                        </span>
                     )}
                  </li>
               );
            })}
         </ul>
      </section>
   );
}

export function SummaryRow({ label, value, strong, valueClassName }) {
   return (
      <div className='flex items-baseline justify-between gap-4'>
         <dt className={strong ? "text-sm font-semibold text-foreground" : "text-sm text-neutral-600"}>{label}</dt>
         <dd
            className={cn(
               "tabular-nums",
               strong ? "text-lg font-bold text-foreground" : "text-sm font-medium text-foreground",
               valueClassName,
            )}
         >
            {value}
         </dd>
      </div>
   );
}

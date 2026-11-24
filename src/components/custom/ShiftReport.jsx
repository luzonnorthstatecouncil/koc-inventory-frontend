import { Printer } from "lucide-react";
import { dateParser, priceParser } from "@/helpers/parser";
import { printShiftReport } from "@/helpers/printShiftReport";
import { cn } from "@/lib/utils";

const TONE = { bad: "text-red-700", warn: "text-amber-700", muted: "text-neutral-500" };

function Row({ label, value, strong, tone }) {
   return (
      <div className='flex items-baseline justify-between gap-3 tabular-nums'>
         <dt className={cn("text-sm", strong ? "font-semibold text-foreground" : "text-neutral-600")}>{label}</dt>
         <dd className={cn(strong ? "text-base font-bold" : "text-sm font-medium", "text-foreground", TONE[tone])}>{value}</dd>
      </div>
   );
}

function Section({ title, children, muted }) {
   return (
      <section className={cn("flex flex-col gap-2 rounded-xl px-4 py-3", muted ? "bg-neutral-50" : "border border-neutral-200")}>
         <h3 className='text-xs font-semibold text-neutral-500'>{title}</h3>
         <dl className='flex flex-col gap-1.5'>{children}</dl>
      </section>
   );
}

const when = (value) => `${dateParser(value, "PP")} · ${dateParser(value, "p")}`;

/** An X (open shift) or Z (closed shift) reading: sales, refunds, voids, payment methods and the drawer count. */
export default function ShiftReport({ report }) {
   if (!report?.shift) return null;
   const { reading, shift, summary, cash } = report;
   const variance = cash.variance;

   return (
      <div className='flex flex-col gap-4'>
         <header className='flex items-start justify-between gap-3'>
            <div className='flex min-w-0 flex-col gap-0.5'>
               <p className='text-sm font-semibold text-foreground'>
                  {reading === "Z" ? "Z reading · shift closed" : "X reading · shift open"}
               </p>
               <p className='text-xs text-neutral-500 tabular-nums'>
                  Shift #{shift.id} · {shift.user?.full_name}
               </p>
               <p className='text-xs text-neutral-500 tabular-nums'>
                  Opened {when(shift.opened_at)}
                  {shift.closed_at && ` · closed ${when(shift.closed_at)}`}
               </p>
            </div>
            <button
               type='button'
               onClick={() => printShiftReport(report)}
               className='flex h-9 shrink-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            >
               <Printer className='size-4' aria-hidden='true' /> Print
            </button>
         </header>

         <Section title='Sales'>
            <Row label={`Sales (${summary.sales_count})`} value={priceParser(summary.gross_sales)} />
            <Row label={`Refunds (${summary.refunds_count})`} value={`−${priceParser(summary.refunds)}`} />
            <div className='mt-0.5 border-t border-neutral-200 pt-1.5'>
               <Row label='Net sales' value={priceParser(summary.net_sales)} strong />
            </div>
            <Row label={`Voided sales (${summary.voids_count})`} value={priceParser(summary.voids)} tone='muted' />
            <Row label='Items sold' value={Number(summary.units_sold || 0).toLocaleString()} tone='muted' />
         </Section>

         {summary.by_payment_method.length > 0 && (
            <Section title='By payment method'>
               {summary.by_payment_method.map((m) => (
                  <Row
                     key={m.method}
                     label={
                        <span>
                           <span className='capitalize'>{m.method}</span> · {m.sales_count} sale{m.sales_count === 1 ? "" : "s"}
                        </span>
                     }
                     value={priceParser(m.net_sales)}
                  />
               ))}
            </Section>
         )}

         <Section title='Cash drawer' muted>
            <Row label='Opening cash' value={priceParser(cash.opening_float)} />
            <Row label='+ Cash sales' value={priceParser(cash.cash_sales)} />
            <Row label='− Cash refunds' value={priceParser(cash.cash_refunds)} />
            <div className='mt-0.5 border-t border-neutral-200 pt-1.5'>
               <Row label='Expected in drawer' value={priceParser(cash.expected)} strong />
            </div>
            {cash.counted !== null && <Row label='Counted' value={priceParser(cash.counted)} strong />}
            {variance !== null && (
               // Short is a problem (red), over needs a look (amber), balanced is just normal
               <Row
                  label={variance === 0 ? "Drawer balances" : variance > 0 ? "Over by" : "Short by"}
                  value={priceParser(Math.abs(variance))}
                  strong
                  tone={variance === 0 ? undefined : variance < 0 ? "bad" : "warn"}
               />
            )}
         </Section>

         {shift.closing_notes && (
            <p className='rounded-xl border border-neutral-200 px-3.5 py-3 text-sm text-neutral-700'>
               <span className='font-semibold text-foreground'>Note:</span> {shift.closing_notes}
            </p>
         )}
      </div>
   );
}

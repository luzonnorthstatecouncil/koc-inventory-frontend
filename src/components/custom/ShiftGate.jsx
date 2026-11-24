import { useState } from "react";
import { toast } from "sonner";
import { Loader2, LockKeyhole, Receipt } from "lucide-react";
import Modal from "@/components/custom/Modal";
import ShiftReport from "@/components/custom/ShiftReport";
import { Skeleton } from "@/components/ui/skeleton";
import { useCloseShiftMutation, useGetCurrentShiftQuery, useOpenShiftMutation } from "@/features/api/shift";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";

const fieldClass =
   "h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base tabular-nums outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgb(17_40_102/0.12)]";
const parseMoney = (v) => {
   const n = parseFloat(String(v ?? "").replace(/,/g, ""));
   return Number.isFinite(n) ? n : NaN;
};

function OpenShift() {
   const exec = useCatchQuery();
   const [openShift, { isLoading }] = useOpenShiftMutation();
   const [float, setFloat] = useState("");
   const amount = parseMoney(float === "" ? "0" : float);

   const submit = async (e) => {
      e.preventDefault();
      if (!(amount >= 0)) return;
      const res = await exec(openShift, { opening_float: amount });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
   };

   return (
      <form onSubmit={submit} className='flex flex-col gap-4'>
         <div className='flex items-start gap-3'>
            <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
               <LockKeyhole className='size-4' />
            </span>
            <div>
               <p className='text-sm lg:text-base font-semibold text-foreground'>Open a shift to start selling</p>
               <p className='text-sm text-neutral-600'>Count the cash in the drawer before your first sale.</p>
            </div>
         </div>
         <label className='flex flex-col gap-1.5'>
            <span className='text-xs lg:text-sm font-semibold text-neutral-600'>Opening cash in drawer</span>
            <input
               className={fieldClass}
               inputMode='decimal'
               autoFocus
               placeholder='0.00'
               value={float}
               onChange={(e) => setFloat(e.target.value.replace(/[^\d.,]/g, ""))}
            />
         </label>
         <button
            type='submit'
            disabled={isLoading || !(amount >= 0)}
            className='flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-semibold text-white disabled:bg-neutral-200 disabled:text-neutral-500'
         >
            {isLoading && <Loader2 className='size-4 animate-spin' />}
            Open shift with {priceParser(Number.isFinite(amount) ? amount : 0)}
         </button>
      </form>
   );
}

function SummaryLine({ label, value, strong }) {
   return (
      <div className='flex items-baseline justify-between gap-4'>
         <dt className={strong ? "text-sm font-semibold text-foreground" : "text-sm text-neutral-600"}>{label}</dt>
         <dd className={cn("tabular-nums", strong ? "text-base font-bold text-foreground" : "text-sm font-medium text-foreground")}>
            {value}
         </dd>
      </div>
   );
}

function CloseShift({ shiftId, report, onClosed, onCancel }) {
   const exec = useCatchQuery();
   const [closeShift, { isLoading }] = useCloseShiftMutation();
   const expected = Number(report?.cash?.expected ?? 0);
   // Prefilled with what the drawer should hold; the cashier changes it only if the count differs.
   const [counted, setCounted] = useState(() => expected.toFixed(2));
   const [notes, setNotes] = useState("");
   const amount = parseMoney(counted);
   const variance = Number.isFinite(amount) ? Math.round((amount - expected) * 100) / 100 : null;

   const submit = async (e) => {
      e.preventDefault();
      if (!(amount >= 0)) return;
      const res = await exec(closeShift, { id: shiftId, counted_cash: amount, notes: notes.trim() || undefined });
      if (!res.success) return toast.error(res.message);
      toast.success(res.message);
      onClosed(res.result.report);
   };

   const cash = report?.cash ?? {};
   const summary = report?.summary ?? {};

   return (
      <form onSubmit={submit} className='flex flex-col gap-4'>
         <div className='grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200'>
            <div className='flex flex-col gap-0.5 bg-white px-4 py-3'>
               <p className='text-xs text-neutral-500'>Sales this shift</p>
               <p className='text-lg font-semibold text-foreground tabular-nums'>{Number(summary.sales_count ?? 0).toLocaleString()}</p>
            </div>
            <div className='flex flex-col gap-0.5 bg-white px-4 py-3'>
               <p className='text-xs text-neutral-500'>Net sales</p>
               <p className='text-lg font-semibold text-foreground tabular-nums'>{priceParser(summary.net_sales ?? 0)}</p>
            </div>
         </div>

         <dl className='flex flex-col gap-2 rounded-xl border border-neutral-200 p-4'>
            <SummaryLine label='Opening cash' value={priceParser(cash.opening_float ?? 0)} />
            <SummaryLine label='Cash sales' value={`+ ${priceParser(cash.cash_sales ?? 0)}`} />
            <SummaryLine label='Cash refunds' value={`− ${priceParser(cash.cash_refunds ?? 0)}`} />
            <div className='mt-1 border-t border-neutral-200 pt-2'>
               <SummaryLine label='Expected in drawer' value={priceParser(expected)} strong />
            </div>
         </dl>

         <label className='flex flex-col gap-1.5'>
            <span className='text-xs font-semibold text-neutral-600'>Cash counted</span>
            <input
               className={fieldClass}
               inputMode='decimal'
               autoFocus
               onFocus={(e) => e.target.select()}
               placeholder='0.00'
               value={counted}
               onChange={(e) => setCounted(e.target.value.replace(/[^\d.,]/g, ""))}
            />
            {variance !== null && (
               <span
                  className={cn(
                     "text-xs font-medium tabular-nums",
                     variance === 0 ? "text-neutral-500" : variance < 0 ? "text-red-700" : "text-amber-700",
                  )}
               >
                  {variance === 0
                     ? "Matches the expected amount."
                     : variance < 0
                       ? `Short by ${priceParser(-variance)}. Add a note explaining the difference.`
                       : `Over by ${priceParser(variance)}. Add a note explaining the difference.`}
               </span>
            )}
         </label>
         <label className='flex flex-col gap-1.5'>
            <span className='text-xs font-semibold text-neutral-600'>Notes (optional)</span>
            <input className={fieldClass} maxLength={255} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='e.g. ₱20 coin short' />
         </label>
         <div className='flex justify-end gap-2'>
            <button type='button' onClick={onCancel} className='h-10 rounded-lg border border-neutral-200 px-4 text-sm font-semibold'>
               Cancel
            </button>
            <button
               type='submit'
               disabled={isLoading || !(amount >= 0)}
               className='flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:bg-neutral-200 disabled:text-neutral-500'
            >
               {isLoading && <Loader2 className='size-4 animate-spin' />}
               Close shift
            </button>
         </div>
      </form>
   );
}

const shiftButton =
   "flex h-10 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3.5 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * The open shift at a glance, for the page header: status, net sales, X reading and close.
 * Renders nothing while there's no open shift (ShiftGate asks for the opening cash instead).
 */
export function ShiftStatus() {
   const { data, refetch } = useGetCurrentShiftQuery(undefined, { refetchOnMountOrArgChange: true });
   const [dialog, setDialog] = useState(null); // "x" | "close" | { z: report }
   // Refresh first so the figures include the latest sale
   const openDialog = (kind) => {
      refetch();
      setDialog(kind);
   };
   const shift = data?.shift;
   const zReport = dialog?.z;

   if (!shift && !zReport) return null;

   return (
      <>
         {shift && (
            <section
               aria-label='Current shift'
               className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl bg-neutral-900 px-4 py-3 text-white'
            >
               <div className='flex flex-wrap items-center gap-x-8 gap-y-2'>
                  <div className='flex flex-col gap-0.5'>
                     <p className='flex items-center gap-2 text-sm font-semibold text-white lg:text-base'>
                        <span className='size-2 rounded-full bg-emerald-400' aria-hidden='true' />
                        Shift open
                     </p>
                     <p className='pl-4 text-xs text-white/60 tabular-nums lg:text-sm'>
                        Since {new Date(shift.opened_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                     </p>
                  </div>
                  <div className='flex flex-col gap-0.5'>
                     <p className='text-sm font-semibold text-white tabular-nums lg:text-base'>
                        {priceParser(data.summary.net_sales)}
                     </p>
                     <p className='text-xs text-white/60 lg:text-sm'>Net sales</p>
                  </div>
                  <div className='flex flex-col gap-0.5'>
                     <p className='text-sm font-semibold text-white tabular-nums lg:text-base'>
                        {data.summary.sales_count.toLocaleString()}
                     </p>
                     <p className='text-xs text-white/60 lg:text-sm'>{data.summary.sales_count === 1 ? "Sale" : "Sales"}</p>
                  </div>
               </div>
               <div className='flex gap-2'>
                  <button type='button' onClick={() => openDialog("x")} className={shiftButton}>
                     <Receipt className='size-4' aria-hidden='true' /> X reading
                  </button>
                  <button type='button' onClick={() => openDialog("close")} className={shiftButton}>
                     <LockKeyhole className='size-4' aria-hidden='true' /> Close shift
                  </button>
               </div>
            </section>
         )}

         <Modal
            isOpen={dialog === "x" || dialog === "close" || Boolean(zReport)}
            onClose={() => setDialog(null)}
            title={zReport ? "Shift closed" : dialog === "close" ? "Close shift" : "X reading"}
            primaryAction={dialog === "close" ? null : { label: "Done", onConfirm: () => setDialog(null) }}
            secondaryAction={null}
            size='lg'
         >
            {dialog === "x" && <ShiftReport report={data} />}
            {dialog === "close" && shift && (
               <CloseShift key={data?.cash?.expected} shiftId={shift.id} report={data} onCancel={() => setDialog(null)} onClosed={(report) => setDialog({ z: report })} />
            )}
            {zReport && <ShiftReport report={zReport} />}
         </Modal>
      </>
   );
}

/**
 * The till: renders `children` (the checkout) only while the cashier has a shift open.
 * Without a shift it asks for the opening cash. The shift's own controls live in ShiftStatus.
 */
/**
 * The till is closed until the cashier opens a shift. Pass a function as children to render
 * anyway and decide per mode: it receives the open-shift form (or null when a shift is open),
 * so stock-only actions such as internal deductions don't need a cash drawer.
 */
export default function ShiftGate({ children }) {
   const { data, isLoading, isError } = useGetCurrentShiftQuery(undefined, { refetchOnMountOrArgChange: true });

   if (isLoading) return <Skeleton className='h-48 w-full rounded-xl' />;
   if (isError) return <p className='text-sm text-red-700'>Couldn&apos;t load your shift. Refresh the page to try again.</p>;

   if (typeof children === "function") return children(data?.shift ? null : <OpenShift />);
   return data?.shift ? children : <OpenShift />;
}

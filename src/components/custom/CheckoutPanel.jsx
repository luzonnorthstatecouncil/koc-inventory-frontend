import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, CornerDownLeft, Loader2, Printer } from "lucide-react";
import {
   setAmountTendered,
   setInvoiceNumber,
   setIsDeduction,
   setPaymentMethod,
   setRemarks,
} from "@/features/slice/cartSlice";
import { PAYMENT_METHOD_OPTIONS } from "@/constants/payment";
import { priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import ISelect from "./Select";

// eslint-disable-next-line react-refresh/only-export-components
export const DEDUCTION_REMARKS_OPTIONS = [
   { label: "Internal Use", value: "Internal Use" },
   { label: "Damage", value: "Damage" },
   { label: "Expired", value: "Expired" },
   { label: "Freebies", value: "Freebies" },
   { label: "Loss", value: "Loss" },
   { label: "Sample", value: "Sample" },
   { label: "Other", value: "Other" },
];

const fieldClass =
   "h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm lg:text-base text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-neutral-400 hover:border-neutral-300 focus:border-primary focus:shadow-[0_0_0_3px_rgb(17_40_102/0.12)]";

const labelClass = "text-xs lg:text-sm font-semibold text-neutral-600";

const primaryButton =
   "flex h-12 lg:h-13 w-full items-center justify-between gap-3 rounded-xl bg-primary px-5 text-white shadow-[0_6px_16px_-6px_rgb(17_40_102/0.55)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[#0B1C4A] active:translate-y-px disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const secondaryButton =
   "flex h-11 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm lg:text-base font-semibold text-foreground transition-colors hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Exact, then the next ₱100 / ₱500 / ₱1,000 above the total, without repeats. */
function quickAmounts(total) {
   if (!(total > 0)) return [];
   const values = [total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000];
   return [...new Set(values.map((v) => Number(v.toFixed(2))))];
}

/** The live receipt: what's owed, what was handed over, what goes back. */
function AmountCard({ label, amount, children }) {
   return (
      <div className='rounded-xl bg-primary px-4 py-3 text-white'>
         <div className='flex items-baseline justify-between gap-3'>
            <span className='text-sm font-medium text-white/70'>{label}</span>
            <span className='text-2xl lg:text-3xl leading-none font-bold tracking-[-0.02em] tabular-nums'>{amount}</span>
         </div>
         {children && <div className='mt-2.5 flex flex-col gap-1 border-t border-white/15 pt-2.5'>{children}</div>}
      </div>
   );
}

function CardRow({ label, value, tone }) {
   return (
      <div className='flex items-baseline justify-between text-sm tabular-nums'>
         <span className='text-white/70'>{label}</span>
         <span
            className={cn(
               "font-semibold",
               tone === "strong" && "text-sm lg:text-base text-white",
               tone === "warn" && "text-amber-300",
               !tone && "text-white/90",
            )}
         >
            {value}
         </span>
      </div>
   );
}

function SaleComplete({ completed, onPrintAgain, onNewSale }) {
   return (
      <div className='flex flex-col gap-4'>
         <div className='flex items-center gap-3'>
            <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white'>
               <Check className='size-4.5' strokeWidth={2.75} />
            </span>
            <div className='min-w-0'>
               <p className='text-sm lg:text-base font-semibold text-foreground'>Sale recorded</p>
               <p className='truncate text-sm tabular-nums text-neutral-600'>
                  Invoice {completed.invoiceNumber} · {plural(completed.count, "item")} · receipt sent to printer
               </p>
            </div>
         </div>

         <AmountCard label='Change due' amount={priceParser(completed.change)}>
            <CardRow label='Total' value={priceParser(completed.total)} />
            <CardRow label='Cash received' value={priceParser(completed.amountTendered)} />
         </AmountCard>

         <div className='grid grid-cols-2 gap-2'>
            <button type='button' className={secondaryButton} onClick={onPrintAgain}>
               <Printer className='size-4' />
               Print again
            </button>
            <button
               type='button'
               autoFocus
               className='flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm lg:text-base font-semibold text-white transition-colors hover:bg-[#0B1C4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
               onClick={onNewSale}
            >
               New sale
            </button>
         </div>
      </div>
   );
}

export default function CheckoutPanel({
   itemCount,
   subtotal,
   total,
   canDeduct,
   deductionNeedsApproval,
   isSubmitting,
   completed,
   error,
   onCharge,
   onDeduct,
   onPrintAgain,
   onNewSale,
   tillClosed = null, // shown instead of the sale form when no shift is open (deductions still work)
}) {
   const dispatch = useDispatch();
   const { invoiceNumber, amountTendered, isDeduction, remarks, paymentMethod } = useSelector((s) => s.cart);
   const [askDeduct, setAskDeduct] = useState(false);

   const tendered = parseFloat(String(amountTendered ?? "").replace(/,/g, "")) || 0;
   const change = tendered - total;
   const quick = useMemo(() => quickAmounts(total), [total]);

   if (completed) {
      return <SaleComplete completed={completed} onPrintAgain={onPrintAgain} onNewSale={onNewSale} />;
   }

   const missing = !itemCount
      ? "Add items to start a sale"
      : !String(invoiceNumber ?? "").trim()
        ? "Enter the invoice no. to charge"
        : tendered < total
          ? "Cash received is less than the total"
          : null;
   const cantCharge = Boolean(missing) || isSubmitting;

   const switchMode = (deduction) => {
      setAskDeduct(false);
      dispatch(setIsDeduction(deduction));
      dispatch(setPaymentMethod(deduction ? "none" : "cash"));
   };

   const submitSale = (e) => {
      e.preventDefault();
      if (cantCharge) return;
      onCharge();
   };

   const showsDiscount = subtotal !== total && !isDeduction;

   return (
      <div className='flex flex-col gap-3'>
         {canDeduct && (
            <div
               role='radiogroup'
               aria-label='Transaction type'
               className='grid grid-cols-2 gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1'
            >
               {[
                  { value: false, label: "Sale" },
                  { value: true, label: "Internal deduction" },
               ].map((opt) => {
                  const active = isDeduction === opt.value;
                  return (
                     <button
                        key={opt.label}
                        type='button'
                        role='radio'
                        aria-checked={active}
                        onClick={() => switchMode(opt.value)}
                        className={cn(
                           "h-8 rounded-md text-sm transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-primary",
                           active
                              ? "bg-white font-semibold text-foreground shadow-[0_1px_3px_rgb(15_23_42/0.12)]"
                              : "font-medium text-neutral-500 hover:text-foreground",
                        )}
                     >
                        {opt.label}
                     </button>
                  );
               })}
            </div>
         )}

         {!isDeduction && tillClosed ? (
            tillClosed
         ) : !isDeduction ? (
            <form onSubmit={submitSale} className='flex flex-col gap-3' noValidate>
               <AmountCard label='Total' amount={priceParser(total)}>
                  {showsDiscount && <CardRow label='Subtotal' value={priceParser(subtotal)} />}
                  {tendered > 0 && change < 0 ? (
                     <CardRow label='Still due' value={priceParser(-change)} tone='warn' />
                  ) : (
                     <CardRow label='Change' value={tendered > 0 ? priceParser(change) : "—"} tone='strong' />
                  )}
               </AmountCard>

               <div className='grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5'>
                  <label className='flex min-w-0 flex-col gap-1.5'>
                     <span className={labelClass}>Invoice no.</span>
                     <input
                        className={cn(fieldClass, "tabular-nums uppercase")}
                        value={invoiceNumber}
                        onChange={(e) => dispatch(setInvoiceNumber(e.target.value))}
                        placeholder='e.g. 20481'
                        autoComplete='off'
                        maxLength={50}
                     />
                  </label>
                  <fieldset className='flex flex-col gap-1.5'>
                     <legend className={cn(labelClass, "mb-1.5")}>Payment</legend>
                     <div className='flex h-11 items-stretch rounded-lg border border-neutral-200 bg-neutral-100 p-1'>
                        {PAYMENT_METHOD_OPTIONS.map((opt) => {
                           const Icon = opt.icon;
                           const selected = paymentMethod === opt.value;
                           return (
                              <button
                                 key={opt.value}
                                 type='button'
                                 disabled={opt.disabled}
                                 aria-pressed={selected}
                                 aria-label={opt.disabled ? `${opt.label}, coming soon` : opt.label}
                                 title={opt.disabled ? `${opt.label} — coming soon` : opt.label}
                                 onClick={() => dispatch(setPaymentMethod(opt.value))}
                                 className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-md text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                                    opt.disabled ? "w-8" : "px-3",
                                    selected
                                       ? "bg-white text-primary shadow-[0_1px_3px_rgb(15_23_42/0.12)]"
                                       : "text-neutral-600 hover:text-foreground",
                                    opt.disabled && "cursor-not-allowed text-neutral-500 hover:text-neutral-400",
                                 )}
                              >
                                 <Icon className='size-4' />
                                 {!opt.disabled && opt.label}
                              </button>
                           );
                        })}
                     </div>
                  </fieldset>
               </div>

               <div className='flex flex-col gap-2'>
                  <label className='flex flex-col gap-1.5'>
                     <span className={labelClass}>Cash received</span>
                     <div className='relative'>
                        <span className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-lg lg:text-xl font-semibold text-neutral-500'>
                           ₱
                        </span>
                        <input
                           className={cn(fieldClass, "h-11 pl-8 text-xl lg:text-2xl font-bold tabular-nums")}
                           inputMode='decimal'
                           value={amountTendered}
                           onChange={(e) => dispatch(setAmountTendered(e.target.value.replace(/[^\d.,]/g, "")))}
                           placeholder='0.00'
                           autoComplete='off'
                        />
                     </div>
                  </label>

                  {quick.length > 0 && (
                     <div className='grid auto-cols-fr grid-flow-col gap-1.5' aria-label='Quick amounts'>
                        {quick.map((value, i) => {
                           const picked = tendered === value;
                           return (
                              <button
                                 key={value}
                                 type='button'
                                 aria-pressed={picked}
                                 onClick={() => dispatch(setAmountTendered(value.toFixed(2)))}
                                 className={cn(
                                    "h-9 truncate rounded-lg border px-2 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                                    picked
                                       ? "border-primary bg-primary/[0.06] text-primary"
                                       : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
                                 )}
                              >
                                 {i === 0 ? "Exact" : `₱${value.toLocaleString("en-PH")}`}
                              </button>
                           );
                        })}
                     </div>
                  )}
               </div>

               {error && (
                  <p role='alert' className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700'>
                     {error}
                  </p>
               )}

               <div className='flex flex-col gap-2'>
                  <button type='submit' className={primaryButton} disabled={cantCharge}>
                     <span className='flex items-center gap-2 text-base lg:text-lg font-semibold'>
                        {isSubmitting && <Loader2 className='size-5 animate-spin' />}
                        {isSubmitting ? "Recording sale…" : "Charge"}
                     </span>
                     {!isSubmitting && (
                        <span className='text-base lg:text-lg font-bold tabular-nums'>{priceParser(total)}</span>
                     )}
                  </button>
                  <p className='flex min-h-4 items-center justify-center gap-1.5 text-xs lg:text-sm text-neutral-500'>
                     {missing ?? (
                        <>
                           Press
                           <kbd className='inline-flex h-5 items-center gap-1 rounded border border-neutral-200 bg-white px-1.5 font-sans text-xs font-semibold text-neutral-600'>
                              Enter <CornerDownLeft className='size-3' />
                           </kbd>
                           to charge
                        </>
                     )}
                  </p>
               </div>
            </form>
         ) : (
            <div className='flex flex-col gap-4'>
               <div className='rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5'>
                  <div className='flex items-baseline justify-between'>
                     <span className='text-sm font-medium text-neutral-600'>Stock value removed</span>
                     <span className='text-xl lg:text-2xl font-bold tracking-[-0.02em] tabular-nums text-foreground'>
                        {priceParser(subtotal)}
                     </span>
                  </div>
                  <p className='mt-2 text-sm leading-relaxed text-neutral-600'>
                     Removes the items from stock without a sale. Total is {priceParser(0)}.
                     {deductionNeedsApproval && " A State Officer approves it before stock changes."}
                  </p>
               </div>

               <ISelect
                  label='Reason'
                  useForm={false}
                  showAll={false}
                  value={remarks}
                  options={DEDUCTION_REMARKS_OPTIONS}
                  triggerClassName='h-11 rounded-lg border-neutral-200 bg-white text-sm lg:text-base'
                  onValueChange={(opt) => opt && dispatch(setRemarks(opt.value))}
               />

               {askDeduct ? (
                  <div
                     role='alertdialog'
                     aria-label='Confirm deduction'
                     className='flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/60 p-4'
                  >
                     <p className='text-sm lg:text-base font-semibold text-foreground'>
                        {deductionNeedsApproval ? "Request removal of" : "Remove"} {plural(itemCount, "item")} from stock as “
                        {remarks}”?{!deductionNeedsApproval && " This can’t be undone."}
                     </p>
                     <div className='grid grid-cols-2 gap-2'>
                        <button type='button' className={secondaryButton} onClick={() => setAskDeduct(false)}>
                           Keep items
                        </button>
                        <button
                           type='button'
                           autoFocus
                           disabled={isSubmitting}
                           onClick={async () => {
                              await onDeduct();
                              setAskDeduct(false);
                           }}
                           className='flex h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm lg:text-base font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700'
                        >
                           {isSubmitting && <Loader2 className='size-4 animate-spin' />}
                           {deductionNeedsApproval ? "Send request" : "Deduct"}
                        </button>
                     </div>
                  </div>
               ) : (
                  <button
                     type='button'
                     className={cn(primaryButton, "justify-center text-base lg:text-lg font-semibold")}
                     disabled={!itemCount || !remarks}
                     onClick={() => setAskDeduct(true)}
                  >
                     {itemCount ? `Deduct ${plural(itemCount, "item")}` : "Deduct items"}
                  </button>
               )}
            </div>
         )}
      </div>
   );
}

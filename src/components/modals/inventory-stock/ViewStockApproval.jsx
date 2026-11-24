import Modal from "@/components/custom/Modal";
import { dateParser, padwithZero } from "@/helpers/parser";
import { cn } from "@/lib/utils";

/** Pending needs action (amber); approved and rejected are outcomes (green / red). */
function approvalStatus(item) {
   // Same rule as before: any rejection reason means rejected
   if (item?.rejection_reason) return { key: "rejected", label: "Rejected", dot: "bg-red-500", text: "text-red-700" };
   if (item?.approved_at) return { key: "approved", label: "Approved", dot: "bg-emerald-500", text: "text-neutral-700" };
   return { key: "pending", label: "Pending", dot: "bg-amber-500", text: "text-amber-700" };
}

const when = (value) => (value ? `${dateParser(value, "PP")} · ${dateParser(value, "p")}` : "—");

function Fact({ label, children }) {
   return (
      <div className='flex items-baseline justify-between gap-4'>
         <dt className='shrink-0 text-sm text-neutral-600'>{label}</dt>
         <dd className='min-w-0 truncate text-end text-sm font-medium text-foreground tabular-nums'>{children}</dd>
      </div>
   );
}

export default function ViewStockApproval({ isOpen, onClose, stockApproval }) {
   const status = approvalStatus(stockApproval);
   const decided = status.key !== "pending";
   const inventory = stockApproval?.variant?.inventory;
   const variant = stockApproval?.variant?.variant_name;
   const isRemove = stockApproval?.request_type === "remove";

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         title={`Stock request #${stockApproval?.id ? padwithZero(stockApproval.id) : ""}`}
         size='md'
         contentClassName='my-0'
         secondaryAction={null}
         primaryAction={{ label: "Close", onClose: onClose }}
      >
         <div className='flex flex-col gap-5'>
            {/* Outcome, quantity, item */}
            <section className='flex flex-col gap-1'>
               <p className={cn("inline-flex items-center gap-2 text-sm font-medium", status.text)}>
                  <span className={cn("size-2 rounded-full", status.dot)} aria-hidden='true' />
                  {status.label}
               </p>
               <p className='text-3xl font-bold tracking-tight text-foreground tabular-nums'>
                  {isRemove ? "−" : "+"}
                  {Number(stockApproval?.quantity || 0).toLocaleString()}{" "}
                  <span className='text-base font-medium text-neutral-500'>{inventory?.unit || "pcs"}</span>
               </p>
               <p className='text-sm text-foreground'>
                  <span className='font-semibold'>{inventory?.name || "Unknown item"}</span>
                  {variant && variant !== "Default" && <span className='text-neutral-500'> · {variant}</span>}
               </p>
               {inventory?.sku && <p className='text-xs text-neutral-500 tabular-nums'>{inventory.sku}</p>}
            </section>

            {status.key === "rejected" && stockApproval?.rejection_reason && (
               <section className='flex flex-col gap-2'>
                  <h3 className='text-xs font-semibold text-neutral-500'>Rejection reason</h3>
                  <p className='rounded-xl border border-neutral-200 px-3.5 py-3 text-sm leading-relaxed text-foreground'>
                     {stockApproval.rejection_reason}
                  </p>
               </section>
            )}

            <section className='flex flex-col gap-2 rounded-xl bg-neutral-50 px-4 py-3'>
               <h3 className='text-xs font-semibold text-neutral-500'>Details</h3>
               <dl className='flex flex-col gap-1.5'>
                  <Fact label='Supplier'>{stockApproval?.supplier?.name || "—"}</Fact>
                  <Fact label='Requested by'>{stockApproval?.requester?.full_name || "—"}</Fact>
                  <Fact label='Requested'>{when(stockApproval?.requested_at)}</Fact>
                  {decided && (
                     <>
                        <Fact label={status.key === "approved" ? "Approved by" : "Rejected by"}>
                           {stockApproval?.approver?.full_name || "—"}
                        </Fact>
                        <Fact label={status.key === "approved" ? "Approved" : "Rejected"}>{when(stockApproval?.approved_at)}</Fact>
                     </>
                  )}
               </dl>
            </section>
         </div>
      </Modal>
   );
}

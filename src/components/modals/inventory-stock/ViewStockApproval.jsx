import Modal from "@/components/custom/Modal";
import { format } from "date-fns";
import { BoxIcon, CalendarDays, Package, Truck, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

function avatarColor(name = "") {
   const palette = [
      "bg-rose-100 text-rose-700",
      "bg-orange-100 text-orange-700",
      "bg-amber-100 text-amber-700",
      "bg-emerald-100 text-emerald-700",
      "bg-cyan-100 text-cyan-700",
      "bg-blue-100 text-blue-700",
      "bg-violet-100 text-violet-700",
      "bg-pink-100 text-pink-700",
   ];
   let hash = 0;
   for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
   return palette[Math.abs(hash) % palette.length];
}

function PersonRow({ label, name, email }) {
   const initials = `${name?.charAt(0) ?? ""}${name?.split(" ")[1]?.charAt(0) ?? ""}`.toUpperCase();
   return (
      <div className='flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5'>
         <div className='flex-shrink-0 size-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center'>
            <User2 className='size-3.5 text-muted-foreground' />
         </div>
         <div className='min-w-0 flex-1'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>{label}</p>
            <div className='flex items-center gap-2 mt-0.5'>
               <div className={`flex-shrink-0 size-5 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor(name)}`}>
                  {initials}
               </div>
               <p className='text-sm font-medium text-foreground truncate'>{name}</p>
            </div>
            {email && <p className='text-sm text-muted-foreground truncate'>{email}</p>}
         </div>
      </div>
   );
}

function DetailRow({ icon: Icon, label, value, valueClassName }) {
   return (
      <div className='flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5'>
         <div className='flex-shrink-0 size-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center'>
            <Icon className='size-3.5 text-muted-foreground' />
         </div>
         <div className='min-w-0'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>{label}</p>
            <p className={cn("text-sm font-medium text-foreground truncate", valueClassName)}>{value ?? "—"}</p>
         </div>
      </div>
   );
}

export default function ViewStockApproval({ isOpen, onClose, stockApproval }) {
   const isApproved = Boolean(stockApproval?.approved_at) && !stockApproval?.rejection_reason;
   const isRejected = Boolean(stockApproval?.rejection_reason);
   const isPending = !Boolean(stockApproval?.approved_at);

   const statusConfig = isApproved
      ? { label: "Approved", pill: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" }
      : isRejected
        ? { label: "Rejected", pill: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-500" }
        : { label: "Pending", pill: "bg-amber-50 text-amber-600 border-amber-200", dot: "bg-amber-400 animate-pulse" };

   const productName = `${stockApproval?.variant?.inventory?.name} - ${stockApproval?.variant?.variant_name}`;
   const sku = stockApproval?.variant?.inventory?.sku;
   const unit = stockApproval?.variant?.inventory?.unit;

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         title={`Stock Request #${stockApproval?.id || ""}`}
         size='md'
         contentClassName='my-0'
         secondaryAction={null}
         primaryAction={{ label: "Close", onClose: onClose }}
      >
         {/* Status banner */}
         <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 mb-4", statusConfig.pill)}>
            <span className={`size-2 rounded-full flex-shrink-0 ${statusConfig.dot}`} />
            <span className='text-xs font-bold'>{statusConfig.label}</span>
         </div>

         {/* Product hero */}
         <div className='flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 mb-4'>
            <div className='p-2 bg-white rounded-lg border border-primary/10 flex-shrink-0'>
               <Package className='size-4 text-primary' />
            </div>
            <div className='min-w-0'>
               <p className='font-bold text-sm text-foreground leading-tight truncate'>{productName}</p>
               {sku && <p className='font-mono text-sm text-muted-foreground mt-0.5'>SKU: {sku}</p>}
            </div>
         </div>

         <div className='space-y-2'>
            {/* Quantity + supplier */}
            <div className='flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5'>
               <div className='flex-shrink-0 size-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center'>
                  <BoxIcon className='size-3.5 text-muted-foreground' />
               </div>
               <div className='min-w-0 flex-1'>
                  <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Quantity</p>
                  <div className='flex items-center gap-2 flex-wrap'>
                     <span className='inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tabular-nums'>
                        +{stockApproval?.quantity} {unit}
                     </span>
                     {stockApproval?.supplier?.name && (
                        <span className='flex items-center gap-1 text-sm text-muted-foreground'>
                           <Truck className='size-3' /> {stockApproval.supplier.name}
                        </span>
                     )}
                  </div>
               </div>
            </div>

            {/* People */}
            <PersonRow
               label='Requested By'
               name={stockApproval?.requester?.full_name}
               email={stockApproval?.requester?.email}
            />

            {stockApproval?.requested_at && (
               <DetailRow
                  icon={CalendarDays}
                  label='Request Date'
                  value={format(new Date(stockApproval.requested_at), "PPP p")}
               />
            )}

            {(isApproved || isRejected) && stockApproval?.approver && (
               <PersonRow
                  label={isApproved ? "Approved By" : "Rejected By"}
                  name={stockApproval.approver.full_name}
                  email={stockApproval.approver.email}
               />
            )}

            {(isApproved || isRejected) && stockApproval?.approved_at && (
               <DetailRow
                  icon={CalendarDays}
                  label={isApproved ? "Approval Date" : "Rejection Date"}
                  value={format(new Date(stockApproval.approved_at), "PPP p")}
               />
            )}
         </div>

         {/* Rejection reason */}
         {isRejected && stockApproval?.rejection_reason && (
            <div className='mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3'>
               <p className='text-xs font-semibold text-red-500 uppercase tracking-wide mb-1'>Rejection Reason</p>
               <p className='text-sm text-red-800'>{stockApproval.rejection_reason}</p>
            </div>
         )}
      </Modal>
   );
}


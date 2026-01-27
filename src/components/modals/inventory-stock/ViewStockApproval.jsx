import Modal from "@/components/custom/Modal";
import Details from "@/components/custom/Details";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Paragraph from "@/components/custom/Paragraph";
import InfoCard from "@/components/custom/InfoCard";

export default function ViewStockApproval({ isOpen, onClose, stockApproval }) {
   const isApproved = Boolean(stockApproval?.approved_at) && !stockApproval?.rejection_reason;
   const isRejected = Boolean(stockApproval?.rejection_reason);
   const isPending = !Boolean(stockApproval?.approved_at);

   const getStatusVariant = () => {
      if (isApproved) return "success";
      if (isRejected) return "destructive";
      return "warning";
   };

   const getStatusLabel = () => {
      if (isApproved) return "Approved";
      if (isRejected) return "Rejected";
      return "Pending";
   };

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         title={
            <div className='flex items-center gap-2'>
               <span>Stock Request #{stockApproval?.id || ""}</span>
               <Badge variant={getStatusVariant()} className='capitalize ms-auto'>
                  {getStatusLabel()}
               </Badge>
            </div>
         }
         description={`Stock request #${stockApproval?.id || ""}`}
         size='md'
         contentClassName='my-0'
         secondaryAction={null}
         primaryAction={{
            label: "Close",
            onClose: onClose,
         }}
      >
         <div className='space-y-4'>
            <InfoCard
               label='Product'
               value={`${stockApproval?.variant?.inventory?.name} - ${stockApproval?.variant?.variant_name}`}
               subtext={`SKU: ${stockApproval?.variant?.inventory?.sku}`}
            />

            <section className='grid grid-cols-2 gap-4'>
               <Details
                  label='Quantity'
                  description={
                     <>
                        <div>{`${stockApproval?.quantity} ${stockApproval?.variant?.inventory?.unit}`}</div>
                        <div className='text-xs text-gray-500'>From: {stockApproval?.supplier?.name}</div>
                     </>
                  }
               />

               <Details
                  label='Requested By'
                  description={
                     <>
                        <div>{stockApproval?.requester?.full_name}</div>
                        <div className='text-xs text-gray-500'>{stockApproval?.requester?.email}</div>
                     </>
                  }
               />

               {stockApproval?.requested_at && (
                  <Details label='Request Date' description={format(new Date(stockApproval.requested_at), "PPP p")} />
               )}

               {isApproved && stockApproval?.approver && (
                  <>
                     <Details
                        label='Approved By'
                        description={
                           <>
                              <div>{stockApproval.approver.full_name}</div>
                              <div className='text-xs text-gray-500'>{stockApproval.approver.email}</div>
                           </>
                        }
                     />
                     {stockApproval?.approved_at && (
                        <Details
                           label='Approval Date'
                           description={format(new Date(stockApproval.approved_at), "PPP p")}
                        />
                     )}
                  </>
               )}

               {isRejected && (
                  <>
                     {stockApproval?.approver && (
                        <Details
                           label='Rejected By'
                           description={
                              <>
                                 <div>{stockApproval.approver.full_name}</div>
                                 <div className='text-xs text-gray-500'>{stockApproval.approver.email}</div>
                              </>
                           }
                        />
                     )}
                     {stockApproval?.approved_at && (
                        <Details
                           label='Rejection Date'
                           description={format(new Date(stockApproval.approved_at), "PPP p")}
                        />
                     )}
                  </>
               )}
            </section>

            {isRejected && stockApproval?.rejection_reason && (
               <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
                  <Paragraph className='text-sm text-red-600 mb-1 font-medium'>Rejection Reason</Paragraph>
                  <Paragraph className='text-sm text-red-900'>{stockApproval.rejection_reason}</Paragraph>
               </div>
            )}
         </div>
      </Modal>
   );
}

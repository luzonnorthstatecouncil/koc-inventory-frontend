import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, STOCK_APPROVALS } from "@/constants/routes";
import { CheckIcon, EyeIcon, Package, User, XIcon } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import {
   useApproveStockApprovalMutation,
   useGetAllStockApprovalsQuery,
   useRejectStockApprovalMutation,
} from "@/features/api/inventory";
import InventoryModals from "@/components/modals/inventory/Modals";
import { useDispatch, useSelector } from "react-redux";
import {
   setOpenRejectStockModal,
   setOpenViewStockModal,
   setSelectedStockApproval,
} from "@/features/slice/inventorySlice";
import { padwithZero } from "@/helpers/parser";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import RejectStockApproval from "@/components/modals/inventory-stock/RejectStockApproval";
import ViewStockApproval from "@/components/modals/inventory-stock/ViewStockApproval";
import { STOCK_ADJUSTMENT_TYPES, STOCK_REQUEST_STATUS } from "@/constants/options";
import { cn } from "@/lib/utils";

function nameInitials(name = "") {
   return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const columns = [
   {
      key: "id",
      title: "ID",
      width: "80px",
      render: (value) => (
         <span className='font-mono text-xs font-bold text-muted-foreground tracking-wider'>
            #{padwithZero(value)}
         </span>
      ),
   },
   {
      key: "variant.inventory.name",
      title: "Product",
      cellClassName: "font-medium",
      render: (value, item) => (
         <div className='flex items-center gap-3'>
            <div className='flex-shrink-0 size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center'>
               <Package className='size-3.5 text-primary/60' />
            </div>
            <div className='flex flex-col gap-0.5 min-w-0'>
               <div className='flex items-center gap-1.5 flex-wrap'>
                  <span className='font-semibold text-sm text-foreground'>{value}</span>
                  {item.variant?.variant_name && (
                     <span className='text-sm font-semibold bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-md'>
                        {item.variant.variant_name}
                     </span>
                  )}
               </div>
               <span className='text-sm text-muted-foreground font-mono tracking-wide'>
                  {item.variant?.inventory?.sku}
               </span>
            </div>
         </div>
      ),
   },
   {
      key: "quantity",
      title: "Quantity",
      width: "160px",
      render: (value, item) => (
         <div className='flex flex-col gap-1'>
            <span className='inline-flex items-center gap-1 text-sm font-bold tabular-nums px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 w-fit'>
               +{value}
               <span className='text-xs font-normal text-emerald-500'>{item.variant?.inventory?.unit}</span>
            </span>
            <span className='text-sm text-muted-foreground'>
               {item.supplier ? (
                  <span className='font-medium text-foreground/70'>via {item.supplier.name}</span>
               ) : (
                  <span className='italic'>No supplier</span>
               )}
            </span>
         </div>
      ),
   },
   {
      key: "requested_by",
      title: "Requested By",
      width: "180px",
      render: (value, item) => (
         <div className='flex items-center gap-2.5'>
            <div className='flex-shrink-0 size-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center'>
               <span className='text-sm font-bold text-gray-600'>{nameInitials(item.requester?.full_name || "")}</span>
            </div>
            <div className='flex flex-col gap-0.5 min-w-0'>
               <span className='text-xs font-semibold text-foreground truncate'>{item.requester?.full_name}</span>
               <span className='text-xs text-muted-foreground truncate'>{item.requester?.email}</span>
            </div>
         </div>
      ),
   },
   {
      key: "approved_at",
      title: "Status",
      width: "120px",
      render: (value, item) => {
         const isApproved = Boolean(value) && !item.rejection_reason;
         const isRejected = Boolean(value) && Boolean(item.rejection_reason);
         const cfg = isApproved
            ? { label: "Approved", dot: "bg-emerald-500", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
            : isRejected
            ? { label: "Rejected", dot: "bg-red-500", className: "bg-red-50 text-red-600 border-red-200" }
            : { label: "Pending", dot: "bg-amber-400 animate-pulse", className: "bg-amber-50 text-amber-700 border-amber-200" };
         return (
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", cfg.className)}>
               <span className={cn("size-1.5 rounded-full flex-shrink-0", cfg.dot)} />
               {cfg.label}
            </span>
         );
      },
   },
];

const productFilters = [
   {
      key: "status",
      label: "Status",
      options: STOCK_REQUEST_STATUS,
   },
   {
      key: "request_type",
      label: "Request Type",
      options: STOCK_ADJUSTMENT_TYPES,
   },
];

export default function StockApprovals() {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();

   const { openRejectStockModal, openViewStockModal, selectedStockApproval } = useSelector((state) => state.inventory);

   const [approveStockApproval] = useApproveStockApprovalMutation();
   const [rejectStockApproval] = useRejectStockApprovalMutation();

   const onApprove = async (data) => {
      const confirmed = await confirm({
         title: "Confirm Approval",
         message: `Are you sure you want to approve the stock request for #${padwithZero(
            data.id
         )}? This action cannot be undone.`,
         confirmLabel: "Yes, Approve",
      });

      if (!confirmed) return;

      const id = toast.loading("Processing approval...");

      const { success, message } = await exec(approveStockApproval, data);

      if (!success) {
         toast.dismiss(id);
         return;
      }

      toast.success(message || `Order #${padwithZero(data.id)} approved successfully`, { id });
   };

   const onReject = async (data) => {
      dispatch(setSelectedStockApproval(data));
      dispatch(setOpenRejectStockModal(true));
   };

   const handleRejectClose = () => {
      dispatch(setOpenRejectStockModal(false));
      dispatch(setSelectedStockApproval(null));
   };

   const handleRejectSubmit = async (formData) => {
      // The reject form submits its values object ({ id, rejection_reason }); it used to be sent
      // as the reason itself, so the API received an object instead of text.
      const rejectionReason = typeof formData === "string" ? formData : formData?.rejection_reason?.trim();
      const confirmed = await confirm({
         title: "Confirm Rejection",
         message: `Are you sure you want to reject the stock request for #${padwithZero(
            selectedStockApproval.id
         )}? This action cannot be undone.`,
         confirmLabel: "Yes, Reject",
      });

      if (!confirmed) return;

      const id = toast.loading("Processing rejection...");

      const payload = {
         id: selectedStockApproval.id,
         rejection_reason: rejectionReason,
      };

      const { success, message } = await exec(rejectStockApproval, payload);

      // The error toast is already shown by the API layer; keep the modal open so it can be retried.
      // (Throwing here used to surface as an uncaught page error.)
      if (!success) {
         toast.dismiss(id);
         return;
      }

      toast.success(message || `Order #${padwithZero(selectedStockApproval.id)} rejected successfully`, { id });
      handleRejectClose();
   };

   const onView = (item) => {
      dispatch(setSelectedStockApproval(item));
      dispatch(setOpenViewStockModal(true));
   };

   const handleViewClose = () => {
      dispatch(setOpenViewStockModal(false));
      dispatch(setSelectedStockApproval(null));
   };

   // Plain array: the handlers are re-created each render, so memoizing never cached anything
   const actions = [
         {
            key: "approve",
            label: "Approve",
            icon: CheckIcon,
            className: "text-green-500",
            action: onApprove,
            show: (item) => !item.approved_at,
         },
         {
            key: "reject",
            label: "Reject",
            icon: XIcon,
            className: "text-destructive",
            action: onReject,
            show: (item) => !item.approved_at,
         },
         {
            key: "view",
            label: "View Details",
            icon: EyeIcon,
            action: onView,
            show: (item) => Boolean(item.approved_at),
         },
   ];

   return (
      <PageLayout
        
         pageTitle={`Stock ${STOCK_APPROVALS.title}`}
         route={STOCK_APPROVALS}
      >
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetAllStockApprovalsQuery,
                  params: {
                     admin_side: true,
                  },
                  options: {
                     refetchOnMountOrArgChange: true,
                  },
               }}
               columns={columns}
               wrapperClassName='mt-2'
               filterable={true}
               filters={productFilters}
               actions={actions}
            />

            <RejectStockApproval
               isOpen={openRejectStockModal}
               onClose={handleRejectClose}
               onSubmit={handleRejectSubmit}
               stockApproval={selectedStockApproval}
            />

            <ViewStockApproval
               isOpen={openViewStockModal}
               onClose={handleViewClose}
               stockApproval={selectedStockApproval}
            />

            <InventoryModals />
         </main>
      </PageLayout>
   );
}

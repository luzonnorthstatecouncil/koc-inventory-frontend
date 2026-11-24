import PageLayout from "@/layout/PageLayout";
import { STOCK_APPROVALS } from "@/constants/routes";
import { CheckIcon, EyeIcon, XIcon } from "lucide-react";
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
import { dateParser, padwithZero } from "@/helpers/parser";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import RejectStockApproval from "@/components/modals/inventory-stock/RejectStockApproval";
import ViewStockApproval from "@/components/modals/inventory-stock/ViewStockApproval";
import { STOCK_ADJUSTMENT_TYPES, STOCK_REQUEST_STATUS } from "@/constants/options";
import { cn } from "@/lib/utils";

const primaryText = "text-sm font-medium text-foreground";
const secondaryText = "text-xs text-neutral-500";

/** Pending needs action (amber); approved and rejected are outcomes (green / red). */
function approvalStatus(item) {
   const decided = Boolean(item?.approved_at);
   if (decided && item?.rejection_reason) return { label: "Rejected", dot: "bg-red-500", text: "text-red-700" };
   if (decided) return { label: "Approved", dot: "bg-emerald-500", text: "text-neutral-700" };
   return { label: "Pending", dot: "bg-amber-500", text: "text-amber-700" };
}

const requestedAt = (item) => item.requested_at || item.created_at;

const columns = [
   {
      key: "variant.inventory.name",
      title: "Product",
      render: (value, item) => {
         const variant = item.variant?.variant_name;
         const sku = item.variant?.inventory?.sku;
         return (
            <div className='flex min-w-0 flex-col gap-0.5'>
               <span className={cn(primaryText, "truncate font-semibold")}>
                  {value}
                  {variant && variant !== "Default" && <span className='font-medium text-neutral-500'> · {variant}</span>}
               </span>
               <span className={cn(secondaryText, "truncate tabular-nums")}>
                  #{padwithZero(item.id)}
                  {sku && ` · ${sku}`}
               </span>
            </div>
         );
      },
   },
   {
      key: "supplier.name",
      title: "Supplier",
      width: "180px",
      render: (_, item) =>
         item.supplier?.name ? (
            <span className={cn(primaryText, "block truncate")} title={item.supplier.name}>{item.supplier.name}</span>
         ) : (
            <span className='text-sm text-neutral-500'>No supplier</span>
         ),
   },
   {
      key: "requested_by",
      title: "Requested by",
      width: "200px",
      render: (_, item) => {
         const at = requestedAt(item);
         return (
            <div className='flex min-w-0 flex-col gap-0.5'>
               <span className={cn(primaryText, "block truncate")} title={item.requester?.full_name}>{item.requester?.full_name || "—"}</span>
               <span className={cn(secondaryText, "block truncate tabular-nums")}>
                  {at ? `${dateParser(at, "PP")} · ${dateParser(at, "p")}` : item.requester?.email}
               </span>
            </div>
         );
      },
   },
   {
      key: "approved_at",
      title: "Status",
      width: "130px",
      render: (_, item) => {
         const status = approvalStatus(item);
         return (
            <span className={cn("inline-flex items-center gap-2 text-sm font-medium", status.text)}>
               <span className={cn("size-2 rounded-full", status.dot)} aria-hidden='true' />
               {status.label}
            </span>
         );
      },
   },
   {
      key: "quantity",
      title: "Quantity",
      width: "120px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value, item) => (
         <span className={cn(primaryText, "tabular-nums")}>
            {item.request_type === "remove" ? "−" : "+"}
            {Number(value || 0).toLocaleString()}{" "}
            <span className='text-neutral-500'>{item.variant?.inventory?.unit || "pcs"}</span>
         </span>
      ),
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
         className: "text-emerald-700",
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
      <PageLayout pageTitle={`Stock ${STOCK_APPROVALS.title}`} route={STOCK_APPROVALS}>
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

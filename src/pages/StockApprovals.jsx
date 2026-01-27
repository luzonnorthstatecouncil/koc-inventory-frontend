import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, STOCK_APPROVALS } from "@/constants/routes";
import { BookAlert, CheckIcon, EditIcon, EyeIcon, TrashIcon, Warehouse, XIcon } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { Badge } from "@/components/ui/badge";
import IProgress from "@/components/custom/Progress";
import {
   useApproveStockApprovalMutation,
   useGetAllStockApprovalsQuery,
   useGetInventoryListQuery,
   useRejectStockApprovalMutation,
} from "@/features/api/inventory";
import InventoryModals from "@/components/modals/inventory/Modals";
import { useDispatch, useSelector } from "react-redux";
import {
   setOpenCreateModal,
   setOpenEditModal,
   setOpenStocksModal,
   setOpenViewModal,
   setOpenRejectStockModal,
   setOpenViewStockModal,
   setOpenUserStockRequestsModal,
   setSelectedItem,
   setSelectedStockApproval,
   setSelectedUserId,
   setSelectedUserName,
} from "@/features/slice/inventorySlice";
import { use, useCallback, useMemo } from "react";
import { padwithZero } from "@/helpers/parser";
import Paragraph from "@/components/custom/Paragraph";
import { render } from "@fullcalendar/core/preact";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import RejectStockApproval from "@/components/modals/inventory-stock/RejectStockApproval";
import ViewStockApproval from "@/components/modals/inventory-stock/ViewStockApproval";
import UserStockRequests from "@/components/modals/inventory-stock/UserStockRequests";
import { STOCK_ADJUSTMENT_TYPES, STOCK_REQUEST_STATUS } from "@/constants/options";

const breadcrumbItems = [{ label: HOME.title }, { label: INVENTORY.title }, { label: STOCK_APPROVALS.title }];

const columns = [
   {
      key: "id",
      title: "ID",
      width: "80px",
      render: (value) => padwithZero(value),
   },
   {
      key: "variant.inventory.name",
      title: "Product",
      cellClassName: "font-medium",
      render: (value, item) => (
         <div className='flex flex-col'>
            <Paragraph size='sm' variant='default'>
               {value} - {item.variant.variant_name}
            </Paragraph>
            <Paragraph size='xs' variant='muted'>
               {item.variant.inventory.sku}
            </Paragraph>
         </div>
      ),
   },
   {
      key: "quantity",
      title: "Quantity",
      width: "150px",
      render: (value, item) => (
         <span className='line-clamp-3'>
            <Paragraph variant='default' size='sm'>
               {value} {item.variant.inventory.unit}
            </Paragraph>
            <Paragraph>{item.supplier ? `from ${item.supplier?.name}` : "Unknown Supplier"}</Paragraph>
         </span>
      ),
   },
   {
      key: "requested_by",
      title: "Requested By",
      width: "150px",
      render: (value, item) => (
         <div
            className='line-clamp-3 cursor-pointer hover:text-primary transition-colors'
            onClick={() => onViewUserRequests(item)}
            title='Click to view all requests by this user'
         >
            <Paragraph variant='default' size='sm'>
               {item.requester.full_name}
            </Paragraph>
            <Paragraph>{item.requester?.email}</Paragraph>
         </div>
      ),
   },
   {
      key: "approved_at",
      title: "Status",
      width: "90px",
      render: (value, item) => {
         return (
            <Badge variant={Boolean(value) ? (item.rejection_reason ? "destructive" : "success") : "warning"}>
               {Boolean(value) ? (item.rejection_reason ? "Rejected" : "Approved") : "Pending"}
            </Badge>
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

      const { success, result, message } = await exec(approveStockApproval, data);

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

   const handleRejectSubmit = async (rejectionReason) => {
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
         ...selectedStockApproval,
         rejection_reason: rejectionReason,
      };

      const { success, result, message } = await exec(rejectStockApproval, payload);

      if (!success) {
         toast.dismiss(id);
         throw new Error(message || "Failed to reject stock approval");
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

   const actions = useMemo(
      () => [
         {
            key: "approve",
            label: "Approve",
            icon: CheckIcon,
            className: "text-green-500",
            action: onApprove,
            show: (item) => !Boolean(item.approved_at),
         },
         {
            key: "reject",
            label: "Reject",
            icon: XIcon,
            className: "text-destructive",
            action: onReject,
            show: (item) => !Boolean(item.approved_at),
         },
         {
            key: "view",
            label: "View Details",
            icon: EyeIcon,
            action: onView,
            show: (item) => Boolean(item.approved_at),
         },
      ],
      [onApprove, onReject]
   );

   return (
      <PageLayout
         breadcrumbItems={breadcrumbItems}
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

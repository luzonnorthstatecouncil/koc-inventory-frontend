import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, INVENTORY_STOCKS } from "@/constants/routes";
import { ArrowRight, CalendarClock, EditIcon, EyeIcon, History, Shovel, Trash2, TriangleAlert } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { Badge } from "@/components/ui/badge";
import { useFlushExpiredStocksMutation, useGetInventoryStockListQuery } from "@/features/api/inventory";
import { useDispatch } from "react-redux";
import {
   setOpenCreateModal,
   setOpenEditModal,
   setOpenViewModal,
   setSelectedStock,
   setOpenAdjustExpiryModal,
   setOpenBulkCreateModal,
} from "@/features/slice/inventoryStockSlice";
import { useCallback, useMemo } from "react";
import { isPast, differenceInDays } from "date-fns";
import { dateParser, padwithZero } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import InventoryStockModals from "@/components/modals/inventory-stock/Modals";
import { useUser } from "@/hooks/useUser";
import { setOpenUserStockRequestsModal } from "@/features/slice/inventorySlice";

const breadcrumbItems = [{ label: HOME.title }, { label: INVENTORY.title }, { label: INVENTORY_STOCKS.title }];

const columns = [
   {
      key: "id",
      title: "ID",
      render: (value) => (
         <span className='font-mono text-xs font-bold text-muted-foreground tracking-wider'>
            #{padwithZero(value, 3)}
         </span>
      ),
   },
   {
      key: "inventory.sku",
      width: "35%",
      title: "Product",
      cellClassName: "font-medium",
      render: (value, item) => {
         const initials = (item.inventory?.name || "?")
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();

         return (
            <div className='flex items-center gap-3'>
               <div className='flex gap-0.5 min-w-0'>
                  <div className='flex flex-col flex-wrap'>
                     <span className='font-semibold text-sm text-foreground leading-snug'>{item.inventory?.name}</span>
                     {item?.archived_at && (
                        <span className='inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full'>
                           <Trash2 className='size-2.5' /> Archived
                        </span>
                     )}
                     <span className='text-sm text-muted-foreground font-mono tracking-wide'>{value}</span>
                  </div>

                  <div className='flex items-center gap-1.5 flex-wrap'>
                     {item.variant?.variant_name && (
                        <>
                           <span className='text-muted-foreground/40 text-xs'>·</span>
                           <span className='text-sm font-semibold bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-md'>
                              {item.variant.variant_name}
                           </span>
                        </>
                     )}
                  </div>
               </div>
            </div>
         );
      },
   },
   {
      key: "reference_no",
      title: "Reference No.",
      width: "160px",
      render: (value) => (
         <span className='inline-flex items-center gap-1.5 font-mono text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg tracking-wider'>
            {value}
         </span>
      ),
   },
   {
      key: "batch_quantity",
      title: "Batch Qty",
      width: "160px",
      render: (value, item) => {
         const before = item.inventory_current ?? 0;
         const after = value + before;
         return (
            <div className='flex flex-col gap-1'>
               <span className='inline-flex items-center gap-1 text-sm font-bold tabular-nums px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 w-fit'>
                  +{value} <span className='text-xs font-normal text-emerald-500'>{item.inventory?.unit}</span>
               </span>
               <div className='flex items-center gap-1 text-sm'>
                  <span className='text-muted-foreground tabular-nums line-through'>{before}</span>
                  <ArrowRight className='size-2.5 text-muted-foreground' />
                  <span className='font-bold text-emerald-600 tabular-nums'>{after}</span>
               </div>
            </div>
         );
      },
   },
   {
      key: "current_quantity",
      title: "Current Qty",
      width: "120px",
      render: (value, item) => {
         const isEmpty = value <= 0;
         const isLow = value > 0 && value <= 5;
         return (
            <span
               className={cn(
                  "inline-flex items-center gap-1 text-sm font-bold tabular-nums px-2 py-0.5 rounded-md w-fit",
                  isEmpty
                     ? "bg-red-50 text-red-600"
                     : isLow
                       ? "bg-orange-50 text-orange-600"
                       : "bg-blue-50 text-blue-700",
               )}
            >
               {value}
               <span
                  className={cn(
                     "text-xs font-normal",
                     isEmpty ? "text-red-400" : isLow ? "text-orange-400" : "text-blue-400",
                  )}
               >
                  {item.inventory?.unit}
               </span>
            </span>
         );
      },
   },
   {
      key: "received_at",
      title: "Received",
      width: "140px",
      render: (value) => (
         <div className='flex flex-col gap-0.5'>
            <span className='text-xs font-semibold text-foreground'>{dateParser(value, "PP")}</span>
         </div>
      ),
   },
   {
      key: "expires_at",
      title: "Expiration",
      width: "160px",
      render: (value, item) => {
         const hasExpiry = Boolean(item.inventory?.has_expiry);
         const isExpired = hasExpiry && value && isPast(value) && !item.archived_at;
         const daysLeft = hasExpiry && value && !isExpired ? differenceInDays(new Date(value), new Date()) : null;
         const isExpiringSoon = daysLeft !== null && daysLeft <= 30;

         if (!hasExpiry || !value) {
            return <span className='text-xs text-muted-foreground'>No expiry</span>;
         }

         return (
            <div className='flex flex-col gap-1'>
               <span
                  className={cn(
                     "text-xs font-semibold",
                     isExpired ? "text-red-600" : isExpiringSoon ? "text-orange-500" : "text-foreground",
                  )}
               >
                  {dateParser(value, "PP")}
               </span>
               {isExpired ? (
                  <span className='inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full w-fit'>
                     <TriangleAlert className='size-2.5' /> Expired
                  </span>
               ) : isExpiringSoon ? (
                  <span className='inline-flex items-center gap-1 text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full w-fit'>
                     <CalendarClock className='size-2.5' /> {daysLeft}d left
                  </span>
               ) : (
                  <span className='inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full w-fit'>
                     <CalendarClock className='size-2.5' /> {daysLeft}d left
                  </span>
               )}
            </div>
         );
      },
   },
];

const stockFilters = [
   {
      key: "is_archived",
      label: "Include Archired Stocks",
      type: "boolean",
   },
   {
      key: "received_at",
      label: "Date Range",
      type: "date",
   },
];

export default function InventoryStocks() {
   const dispatch = useDispatch();
   const [flushExpired] = useFlushExpiredStocksMutation();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const user = useUser();

   const onViewItem = useCallback(
      (item) => {
         dispatch(setOpenViewModal(true));
         dispatch(setSelectedStock(item));
      },
      [dispatch],
   );

   const onCreate = useCallback(() => {
      dispatch(setOpenCreateModal(true));
   }, [dispatch]);

   const onBulkCreate = useCallback(() => {
      dispatch(setOpenBulkCreateModal(true));
   }, [dispatch]);

   const onEdit = useCallback(
      (item) => {
         dispatch(setOpenEditModal(true));
         dispatch(setSelectedStock(item));
      },
      [dispatch],
   );

   const onAdjustExpiry = useCallback(
      (item) => {
         dispatch(setOpenAdjustExpiryModal(true));
         dispatch(setSelectedStock(item));
      },
      [dispatch],
   );

   const onViewUserRequests = (item) => {
      dispatch(setOpenUserStockRequestsModal(true));
   };

   const onFlush = useCallback(
      async (item) => {
         const confirmed = await confirm({
            title: "Flush Expired Stocks",
            message: `Are you sure you want to flush and delete ${item.current_quantity} expired stock${
               item.batch_quantity > 1 && "s"
            } of ${item.reference_no} from ${item.inventory.sku}?`,
            variant: "destructive",
         });

         if (!confirmed) return;

         const payload = {
            expired_stocks: [item],
         };

         const { success, message } = await exec(flushExpired, payload);
         if (!success) return;

         dispatch(setSelectedStock(null));
         toast.success(message);
      },
      [dispatch],
   );

   const actions = useMemo(
      () => [
         {
            key: "view",
            label: "View Details",
            icon: EyeIcon,
            action: onViewItem,
            show: (item) => !Boolean(item.archived_at),
         },
         {
            key: "edit",
            label: "Adjust Stock",
            icon: EditIcon,
            action: onEdit,
            show: (item) => !Boolean(item.archived_at),
            roles: ["admin", "supervisor"],
         },
         {
            key: "Flush",
            icon: Shovel,
            label: "Flush & Delete",
            show: (item) =>
               item.expires_at &&
               isPast(item.expires_at) &&
               !item.archived_at &&
               Boolean(item.inventory.has_expiry) &&
               Boolean(item.archived_at),
            className: "text-destructive",
            action: onFlush,
            roles: ["admin", "supervisor"],
         },
         {
            key: "adjust_expiry",
            icon: History,
            label: "Adjust Expiration",
            show: (item) => Boolean(item.inventory.has_expiry) && !Boolean(item.archived_at),
            action: onAdjustExpiry,
            roles: ["admin"],
         },
      ],
      [onViewItem, onEdit, onFlush, onAdjustExpiry],
   );

   return (
      <PageLayout
         breadcrumbItems={breadcrumbItems}
         pageTitle={`Inventory ${INVENTORY_STOCKS.title}`}
         pageDescription='Manage the stock levels of your inventory items. View details, adjust quantities, and keep track of expiration dates all in one place.'
         route={INVENTORY_STOCKS}
      >
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetInventoryStockListQuery,
                  options: {
                     refetchOnMountOrArgChange: true,
                  },
               }}
               columns={columns}
               wrapperClassName='mt-2'
               actions={actions}
               filterable
               filters={stockFilters}
               actionButtons={[
                  {
                     label: "Bulk Add",
                     onClick: onBulkCreate,
                     variant: "ghost",
                     className: "text-primary",
                     roles: ["admin", "supervisor"],
                  },
                  {
                     label: "View Stock Requests",
                     onClick: onViewUserRequests,
                     variant: "ghost",
                     className: "text-primary",
                     icon: <Shovel className='mr-2 h-4 w-4' />,
                     roles: ["admin", "supervisor"],
                     hidden: user?.role !== "supervisor",
                  },
                  {
                     label: "Create New Stock",
                     onClick: onCreate,
                     icon: <EditIcon className='mr-2 h-4 w-4' />,
                     roles: ["admin", "supervisor"],
                  },
               ]}
            />

            <InventoryStockModals />
         </main>
      </PageLayout>
   );
}

import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, INVENTORY_STOCKS } from "@/constants/routes";
import { ArrowRight, EditIcon, EyeIcon, History, Shovel, Trash2, TrashIcon, TriangleAlert } from "lucide-react";
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
} from "@/features/slice/inventoryStockSlice";
import { useCallback, useMemo } from "react";
import { isPast } from "date-fns";
import { dateParser, padwithZero } from "@/helpers/parser";
import ITooltip from "@/components/custom/Tooltip";
import { cn } from "@/lib/utils";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import InventoryStockModals from "@/components/modals/inventory-stock/Modals";
import { useUser } from "@/hooks/useUser";
import { setOpenUserStockRequestsModal, setSelectedUserId, setSelectedUserName } from "@/features/slice/inventorySlice";

const breadcrumbItems = [{ label: HOME.title }, { label: INVENTORY.title }, { label: INVENTORY_STOCKS.title }];

const columns = [
   {
      key: "id",
      title: "ID",
      render: (value) => padwithZero(value, 3),
   },
   {
      key: "inventory.sku",
      width: "35%",
      title: "Product",
      cellClassName: "font-medium",
      render: (value, item) => (
         <div className='flex flex-col'>
            <span className='flex items-center gap-1'>
               {item.inventory?.name} - {item.variant?.variant_name}{" "}
               {item?.archived_at && <Trash2 className='text-muted-foreground size-4' />}
            </span>
            <span className='text-xs text-muted-foreground'>{value}</span>
         </div>
      ),
   },
   {
      key: "reference_no",
      title: "Reference Number",
      width: "170px",
      render: (value) => (
         <Badge variant='outline' className='font-mono'>
            {value}
         </Badge>
      ),
   },
   {
      key: "batch_quantity",
      title: "Batch Quantity",
      width: "150px",
      render: (value, item) => (
         <div className='py-1'>
            <span className='font-semibold'>
               {value} {item.inventory?.unit}
            </span>
            <div className='grid grid-cols-3 w-15 items-center justify-center font-semibold text-xs'>
               <span className='text-gray-400 line-through'>{item.inventory_current}</span>
               <ArrowRight className='size-3' />
               <span className='text-green-600'>{value + item.inventory_current}</span>
            </div>
         </div>
      ),
   },
   {
      key: "current_quantity",
      title: "Current Quantity",
      render: (value, item) => `${value} ${item.inventory?.unit}`,
   },
   {
      key: "received_at",
      title: "Received Date",
      width: "200px",
      render: (value) => dateParser(value, "PP"),
   },
   {
      key: "expires_at",
      title: "Expiration Date",
      width: "150px",
      render: (value, item) => {
         const isExpired =
            item.expires_at && isPast(item.expires_at) && !item.archived_at && Boolean(item.inventory.has_expiry);

         return (
            <div className='flex items-center gap-2'>
               <ITooltip label={isExpired ? "Expired" : ""}>
                  <span className={cn(isExpired && "text-destructive font-semibold", "flex items-center gap-1")}>
                     {dateParser(value, "PP")}
                     {isExpired && <TriangleAlert className='size-4 text-destructive' />}
                  </span>
               </ITooltip>
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
                     label: "Create New Stock",
                     onClick: onCreate,
                     icon: <EditIcon className='mr-2 h-4 w-4' />,
                     roles: ["admin", "supervisor"],
                  },
                  {
                     label: <History className='size-5' />,
                     onClick: onViewUserRequests,
                     icon: <Shovel className='mr-2 h-4 w-4' />,
                     roles: ["admin", "supervisor"],
                     hidden: user?.role !== "supervisor",
                  },
               ]}
            />

            <InventoryStockModals />
         </main>
      </PageLayout>
   );
}

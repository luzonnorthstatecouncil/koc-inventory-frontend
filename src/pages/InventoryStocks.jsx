import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, INVENTORY_STOCKS } from "@/constants/routes";
import { EditIcon, EyeIcon, History, Shovel } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
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
import { isPast, differenceInCalendarDays } from "date-fns";
import { dateParser, padwithZero } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import InventoryStockModals from "@/components/modals/inventory-stock/Modals";
import { useUser } from "@/hooks/useUser";
import { setOpenUserStockRequestsModal } from "@/features/slice/inventorySlice";

const primaryText = "text-sm font-medium text-foreground";
const secondaryText = "text-xs text-neutral-500";
const EXPIRY_WARNING_DAYS = 30;

const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/** Expiry in words: red once expired, amber inside the warning window, neutral otherwise. */
function expiryState(item) {
   const value = item.expires_at;
   if (!item.inventory?.has_expiry || !value) return null;
   if (item.archived_at) return { label: dateParser(value, "PP"), text: "text-neutral-500" };
   const days = differenceInCalendarDays(new Date(value), new Date());
   if (days < 0) return { label: "Expired", note: dateParser(value, "PP"), text: "text-red-700", dot: "bg-red-500" };
   if (days <= EXPIRY_WARNING_DAYS)
      return {
         label: days === 0 ? "Expires today" : `Expires in ${plural(days, "day")}`,
         note: dateParser(value, "PP"),
         text: "text-amber-700",
         dot: "bg-amber-500",
      };
   return { label: dateParser(value, "PP"), note: `${plural(days, "day")} left`, text: "text-foreground" };
}

const columns = [
   {
      key: "inventory.sku",
      width: "32%",
      title: "Product",
      render: (value, item) => {
         const variant = item.variant?.variant_name;
         return (
            <div className='flex min-w-0 flex-col gap-0.5'>
               <span className={cn(primaryText, "truncate font-semibold", item.archived_at && "text-neutral-500")}>
                  {item.inventory?.name}
               </span>
               <span className={cn(secondaryText, "truncate tabular-nums")}>
                  {value}
                  {variant && variant !== "Default" && ` · ${variant}`}
               </span>
            </div>
         );
      },
   },
   {
      key: "reference_no",
      title: "Batch",
      width: "160px",
      render: (value, item) => (
         <div className='flex flex-col gap-0.5'>
            <span className={cn(primaryText, "tabular-nums", item.archived_at && "text-neutral-500 line-through")}>
               {value}
            </span>
            <span className={cn(secondaryText, "tabular-nums")}>
               #{padwithZero(item.id, 3)}
               {item.archived_at && " · Archived"}
            </span>
         </div>
      ),
   },
   {
      key: "received_at",
      title: "Received",
      width: "140px",
      render: (value) =>
         value ? (
            <div className='flex flex-col gap-0.5'>
               <span className={primaryText}>{dateParser(value, "PP")}</span>
               <span className={cn(secondaryText, "tabular-nums")}>{dateParser(value, "p")}</span>
            </div>
         ) : (
            <span className='text-sm text-neutral-500'>—</span>
         ),
   },
   {
      key: "expires_at",
      title: "Expires",
      width: "170px",
      render: (_, item) => {
         const state = expiryState(item);
         if (!state) return <span className='text-sm text-neutral-500'>No expiry</span>;
         return (
            <div className='flex flex-col gap-0.5'>
               <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", state.text)}>
                  {state.dot && <span className={cn("size-1.5 rounded-full", state.dot)} aria-hidden='true' />}
                  {state.label}
               </span>
               {state.note && <span className={cn(secondaryText, "tabular-nums")}>{state.note}</span>}
            </div>
         );
      },
   },
   {
      key: "batch_quantity",
      title: "Received qty",
      width: "140px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      // What the batch added to the item's stock: before → after
      render: (value, item) => {
         const before = Number(item.inventory_current ?? 0);
         const added = Number(value) || 0;
         return (
            <div className='flex flex-col items-end gap-0.5'>
               <span className={cn(primaryText, "tabular-nums")}>
                  +{added.toLocaleString()} <span className='font-medium text-neutral-500'>{item.inventory?.unit}</span>
               </span>
               <span className={cn(secondaryText, "tabular-nums")}>
                  {before.toLocaleString()} → {(before + added).toLocaleString()}
               </span>
            </div>
         );
      },
   },
   {
      key: "current_quantity",
      title: "Remaining",
      width: "130px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value, item) => {
         const left = Number(value) || 0;
         const empty = left <= 0;
         const low = !empty && left <= 5;
         return (
            <div className='flex flex-col items-end gap-0.5'>
               <span className={cn(primaryText, "tabular-nums", item.archived_at && "text-neutral-500")}>
                  {left.toLocaleString()} <span className='font-medium text-neutral-500'>{item.inventory?.unit}</span>
               </span>
               {!item.archived_at && (empty || low) && (
                  <span className={cn("inline-flex items-center gap-1.5 text-xs", empty ? "text-red-700" : "text-amber-700")}>
                     <span className={cn("size-1.5 rounded-full", empty ? "bg-red-500" : "bg-amber-500")} aria-hidden='true' />
                     {empty ? "Used up" : "Running low"}
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
      label: "Include Archived Stocks",
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
               item.current_quantity === 1 ? "" : "s"
            } of ${item.reference_no} from ${item.inventory?.sku}?`,
            variant: "destructive",
         });

         if (!confirmed) return;

         // The server re-reads the batch; only its id is needed
         const payload = {
            expired_stocks: [{ id: item.id }],
         };

         const { success, message } = await exec(flushExpired, payload);
         if (!success) return;

         dispatch(setSelectedStock(null));
         toast.success(message);
      },
      [confirm, dispatch, exec, flushExpired],
   );

   const actions = useMemo(
      () => [
         {
            key: "view",
            label: "View Details",
            icon: EyeIcon,
            action: onViewItem,
            show: (item) => !item.archived_at,
         },
         {
            key: "edit",
            label: "Adjust Stock",
            icon: EditIcon,
            action: onEdit,
            show: (item) => !item.archived_at,
            roles: ["admin", "supervisor"],
         },
         {
            key: "Flush",
            icon: Shovel,
            label: "Flush & Delete",
            show: (item) =>
               Boolean(item.expires_at) &&
               isPast(item.expires_at) &&
               !item.archived_at &&
               Boolean(item.inventory?.has_expiry),
            className: "text-destructive",
            action: onFlush,
            roles: ["admin", "supervisor"],
         },
         {
            key: "adjust_expiry",
            icon: History,
            label: "Adjust Expiration",
            show: (item) => Boolean(item.inventory.has_expiry) && !item.archived_at,
            action: onAdjustExpiry,
            roles: ["admin"],
         },
      ],
      [onViewItem, onEdit, onFlush, onAdjustExpiry],
   );

   return (
      <PageLayout
        
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

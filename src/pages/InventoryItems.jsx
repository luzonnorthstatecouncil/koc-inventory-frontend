import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, INVENTORY_ITEMS } from "@/constants/routes";
import { AlertCircle, EditIcon, EyeIcon, ReceiptText, TrashIcon, Upload } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { Badge } from "@/components/ui/badge";
import { useDeleteItemMutation, useGetInventoryListQuery } from "@/features/api/inventory";
import InventoryModals from "@/components/modals/inventory/Modals";
import { useDispatch } from "react-redux";
import { setOpenBulkCreateModal, setOpenCreateModal, setOpenEditModal, setOpenOrdersModal, setOpenViewModal, setSelectedItem } from "@/features/slice/inventorySlice";
import { useCallback, useMemo } from "react";
import ITooltip from "@/components/custom/Tooltip";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import VariantsAccordion from "@/components/custom/VariantsAccordion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_COLORS = [
   "bg-violet-100 text-violet-700 border-violet-200",
   "bg-blue-100 text-blue-700 border-blue-200",
   "bg-emerald-100 text-emerald-700 border-emerald-200",
   "bg-amber-100 text-amber-700 border-amber-200",
   "bg-rose-100 text-rose-700 border-rose-200",
   "bg-cyan-100 text-cyan-700 border-cyan-200",
   "bg-orange-100 text-orange-700 border-orange-200",
];

function categoryColor(name = "") {
   let hash = 0;
   for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
   return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

function StockBar({ value, reorder, safe, max }) {
   const ceiling = Math.max(max || 0, value || 0, 1);
   const pct = Math.min(((value || 0) / ceiling) * 100, 100);
   const barColor =
      value <= reorder ? "bg-red-500" : value >= safe ? "bg-emerald-500" : "bg-primary";
   return (
      <div className='w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden'>
         <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
      </div>
   );
}

const columns = [
   {
      key: "sku",
      title: "Product",
      cellClassName: "font-medium",
      render: (value, item) => (
         <div className='flex flex-col gap-0.5'>
            <span className='font-semibold text-foreground'>{item.name}</span>
            <span className='text-sm text-muted-foreground font-mono tracking-wide'>{value}</span>
         </div>
      ),
   },
   {
      key: "category_name",
      title: "Category",
      width: "160px",
      render: (value) => (
         <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border", categoryColor(value || ""))}>
            <span className='size-1.5 rounded-full bg-current opacity-60 flex-shrink-0' />
            {value || "Uncategorized"}
         </span>
      ),
   },
   {
      key: "current_qty",
      title: "Current Stock",
      width: "170px",
      render: (value, item) => {
         const isLow = value <= item.reorder_level;
         const isGood = value >= item.safe_qty_level;
         return (
            <div className='flex flex-col gap-1'>
               <div className='flex items-center gap-1.5'>
                  <span className={cn("text-sm font-bold tabular-nums", isLow ? "text-red-600" : isGood ? "text-emerald-600" : "text-primary")}>
                     {value}
                  </span>
                  <span className='text-xs text-muted-foreground'>unit{value !== 1 ? "s" : ""}</span>
                  {item.has_expiry && item.has_expired_stock && (
                     <ITooltip label='Has Expired Stock'>
                        <AlertCircle className='text-destructive size-3.5' />
                     </ITooltip>
                  )}
               </div>
               <StockBar value={value} reorder={item.reorder_level} safe={item.safe_qty_level} max={item.max_qty_level} />
            </div>
         );
      },
   },
   {
      key: "price",
      width: "130px",
      title: "Unit Price",
      render: (value) => (
         <span className='font-semibold text-foreground tabular-nums'>
            PHP {parseFloat(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
         </span>
      ),
   },
   {
      key: "status",
      title: "Status",
      width: "130px",
      render: (value) => {
         const cfg =
            value === "active"
               ? { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200 border", dot: "bg-emerald-500" }
               : value === "out of stock"
               ? { label: "Out of Stock", className: "bg-red-50 text-red-700 border-red-200 border", dot: "bg-red-500" }
               : { label: value, className: "bg-gray-100 text-gray-600 border-gray-200 border", dot: "bg-gray-400" };
         return (
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize", cfg.className)}>
               <span className={cn("size-1.5 rounded-full flex-shrink-0 animate-pulse", cfg.dot)} />
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
      options: [
         { value: "active", label: "Active" },
         { value: "inactive", label: "Inactive" },
         { value: "out of stock", label: "Out of Stock" },
      ],
   },
   {
      key: "priceRange",
      label: "Price Range",
      options: [
         {
            value: "0-100",
            label: "Under PHP 100",
            matcher: (price) => parseFloat(price) < 100,
         },
         {
            value: "100-500",
            label: "PHP 100 - PHP 500",
            matcher: (price) => {
               const p = parseFloat(price);
               return p >= 100 && p <= 500;
            },
         },
         {
            value: "500-1000",
            label: "PHP 500 - PHP 1000",
            matcher: (price) => {
               const p = parseFloat(price);
               return p >= 500 && p <= 1000;
            },
         },
         {
            value: "1000-99999999999",
            label: "Over PHP 1000",
            matcher: (price) => parseFloat(price) > 1000,
         },
      ],
   },
];

export default function InventoryItems() {
   const dispatch = useDispatch();
   const [deleteItem] = useDeleteItemMutation();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();

   const onViewItem = useCallback(
      (item) => {
         dispatch(setOpenViewModal(true));
         dispatch(setSelectedItem(item));
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
         dispatch(setSelectedItem(item));
      },
      [dispatch],
   );

   const onViewOrders = useCallback(
      (item) => {
         dispatch(setOpenOrdersModal(true));
         dispatch(setSelectedItem(item));
      },
      [dispatch],
   );

   const onDeleteItem = useCallback(
      async (item) => {
         const confirmed = await confirm({
            title: "Delete Item",
            message: `Are you sure you want to delete ${item.name}? Make sure to remove all associated stocks and orders before deleting this item.`,
            variant: "destructive",
         });

         if (!confirmed) return;

         const { success, message } = await exec(deleteItem, { id: item.id });
         if (!success) return;

         toast.success(message);
      },
      [confirm, deleteItem, exec],
   );

   const actions = useMemo(
      () => [
         {
            key: "view",
            label: "View Details",
            icon: EyeIcon,
            action: onViewItem,
         },
         {
            key: "edit",
            label: "Edit Product",
            icon: EditIcon,
            roles: ["admin", "supervisor"],
            action: onEdit,
         },
         {
            key: "orders",
            label: "View Orders",
            icon: ReceiptText,
            action: onViewOrders,
         },
         {
            key: "delete",
            label: "Delete Product",
            icon: TrashIcon,
            className: "text-destructive",
            roles: ["admin", "supervisor"],
            action: onDeleteItem,
         },
      ],
      [onViewItem, onEdit, onViewOrders, onDeleteItem],
   );

   return (
      <PageLayout
        
         pageTitle={`Inventory ${INVENTORY_ITEMS.title}`}
         pageDescription='Manage your inventory items. View details, adjust stock levels, and keep track of orders all in one place.'
         route={INVENTORY_ITEMS}
      >
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetInventoryListQuery,
                  params: {
                     status: "active",
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
               actionButtons={[
                  {
                     label: "Bulk Add",
                     onClick: onBulkCreate,
                     variant: "ghost",
                     className: "text-primary",
                     roles: ["admin", "supervisor"],
                  },
                  {
                     label: "Add Product",
                     onClick: onCreate,
                     roles: ["admin", "supervisor"],
                  },
               ]}
               expandable={true}
               renderExpandedRow={(item) => {
                  const sortedVariants = [...(item.variants || [])].sort((a, b) => b.current_qty - a.current_qty);
                  return <VariantsAccordion variants={sortedVariants} />;
               }}
               expandedRowClassName='bg-gray-50/50'
            />

            <InventoryModals />
         </main>
      </PageLayout>
   );
}

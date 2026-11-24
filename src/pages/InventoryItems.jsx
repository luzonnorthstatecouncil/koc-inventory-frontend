import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, INVENTORY_ITEMS } from "@/constants/routes";
import { AlertCircle, EditIcon, EyeIcon, ReceiptText, TrashIcon, Upload } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { useDeleteItemMutation, useGetInventoryListQuery } from "@/features/api/inventory";
import InventoryModals from "@/components/modals/inventory/Modals";
import { useGetCategoryListQuery } from "@/features/api/category";
import { useDispatch } from "react-redux";
import { setOpenBulkCreateModal, setOpenCreateModal, setOpenEditModal, setOpenOrdersModal, setOpenViewModal, setSelectedItem } from "@/features/slice/inventorySlice";
import { useCallback, useMemo } from "react";
import { stockState } from "@/components/custom/PointOfSaleItem";
import { priceParser } from "@/helpers/parser";
import { AddStockLink } from "@/components/custom/RestockLinks";
import { mostUrgentVariant } from "@/helpers/restock";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import VariantsAccordion from "@/components/custom/VariantsAccordion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const primaryText = "text-sm font-medium text-foreground";
const secondaryText = "text-xs text-neutral-500";

// Same wording as the Sales screen; colour only when staff need to act.
const STOCK_TONE = {
   ok: { dot: "bg-neutral-300", text: "text-neutral-500" },
   low: { dot: "bg-amber-500", text: "text-amber-700" },
   critical: { dot: "bg-red-500", text: "text-red-700" },
   out: { dot: "bg-red-500", text: "text-red-700" },
};

const ITEM_STATUS = {
   active: { label: "Active", dot: "bg-emerald-500", text: "text-neutral-700" },
   inactive: { label: "Inactive", dot: "bg-neutral-300", text: "text-neutral-500" },
   "out of stock": { label: "Out of stock", dot: "bg-red-500", text: "text-red-700" },
};

const columns = [
   {
      key: "sku",
      title: "Product",
      render: (value, item) => (
         <div className='flex min-w-0 flex-col gap-0.5'>
            <span className={cn(primaryText, "truncate font-semibold")}>{item.name}</span>
            <span className={cn(secondaryText, "truncate tabular-nums")}>{value}</span>
         </div>
      ),
   },
   {
      key: "category_name",
      title: "Category",
      width: "160px",
      render: (value) =>
         value ? <span className={primaryText}>{value}</span> : <span className='text-sm text-neutral-500'>Uncategorized</span>,
   },
   {
      key: "current_qty",
      title: "Stock",
      width: "180px",
      render: (value, item) => {
         const qty = Number(value) || 0;
         const state = stockState(qty, item.reorder_level, item.safe_qty_level);
         const tone = STOCK_TONE[state.tone];
         const expired = item.has_expiry && item.has_expired_stock;
         // A second line only when there's something to act on. "Out of stock" is left to the
         // Status column unless the item is still marked active.
         const warning =
            state.tone === "low"
               ? "Low stock"
               : state.tone === "critical"
                 ? "Reorder now"
                 : state.tone === "out" && item.status !== "out of stock"
                   ? "Out of stock"
                   : null;
         return (
            <div className='flex flex-col gap-0.5'>
               <span className={cn(primaryText, "tabular-nums")}>
                  {qty.toLocaleString()} <span className='font-medium text-neutral-500'>{qty === 1 ? "unit" : "units"}</span>
               </span>
               {expired && (
                  <span className='inline-flex items-center gap-1.5 text-xs text-red-700'>
                     <AlertCircle className='size-3' aria-hidden='true' />
                     Has expired stock
                  </span>
               )}
               {!expired && warning && (
                  <span className='inline-flex flex-wrap items-center gap-x-2 gap-y-0.5'>
                     <span className={cn("inline-flex items-center gap-1.5 text-xs", tone.text)}>
                        <span className={cn("size-1.5 rounded-full", tone.dot)} aria-hidden='true' />
                        {warning}
                     </span>
                     {/* Restock the variant that needs it most, right from the warning */}
                     <AddStockLink variant={mostUrgentVariant(item.variants) ?? item.variants?.[0]} variantLabel />
                  </span>
               )}
            </div>
         );
      },
   },
   {
      key: "status",
      title: "Status",
      width: "130px",
      render: (value) => {
         const status = ITEM_STATUS[value] ?? { label: value || "—", dot: "bg-neutral-200", text: "text-neutral-500" };
         return (
            <span className={cn("inline-flex items-center gap-2 text-sm font-medium", status.text)}>
               <span className={cn("size-2 rounded-full", status.dot)} aria-hidden='true' />
               {status.label}
            </span>
         );
      },
   },
   {
      key: "price",
      title: "Unit price",
      width: "130px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value) => <span className='text-sm font-semibold text-foreground tabular-nums'>{priceParser(value)}</span>,
   },
];

const statusFilter = {
   key: "status",
   label: "Status",
   options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "out of stock", label: "Out of Stock" },
   ],
};

export default function InventoryItems() {
   const dispatch = useDispatch();
   const { data: categoryList } = useGetCategoryListQuery();

   // Category options come from the category list; the API filters on `category` (a category id).
   const productFilters = useMemo(
      () => [
         statusFilter,
         {
            key: "category",
            label: "Category",
            options: (categoryList ?? []).map((c) => ({ value: String(c.id), label: c.name })),
         },
      ],
      [categoryList],
   );
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
               expandedRowClassName='bg-neutral-50 hover:bg-neutral-50'
            />

            <InventoryModals />
         </main>
      </PageLayout>
   );
}

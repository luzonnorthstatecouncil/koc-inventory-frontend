import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, INVENTORY_ITEMS } from "@/constants/routes";
import { AlertCircle, EditIcon, EyeIcon, ReceiptText, TrashIcon, Upload } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { Badge } from "@/components/ui/badge";
import { useDeleteItemMutation, useGetInventoryListQuery } from "@/features/api/inventory";
import InventoryModals from "@/components/modals/inventory/Modals";
import { useDispatch } from "react-redux";
import {
   setOpenBulkCreateModal,
   setOpenCreateModal,
   setOpenEditModal,
   setOpenOrdersModal,
   setOpenStocksModal,
   setOpenViewModal,
   setSelectedItem,
} from "@/features/slice/inventorySlice";
import { useCallback, useMemo } from "react";
import ITooltip from "@/components/custom/Tooltip";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import VariantsAccordion from "@/components/custom/VariantsAccordion";

const breadcrumbItems = [{ label: HOME.title }, { label: INVENTORY.title }, { label: INVENTORY_ITEMS.title }];

const columns = [
   {
      key: "sku",
      title: "Product",
      cellClassName: "font-medium",
      render: (value, item) => (
         <div className='flex flex-col'>
            <span>{item.name}</span>
            <span className='text-xs text-muted-foreground'>{value}</span>
         </div>
      ),
   },
   {
      key: "category_name",
      title: "Category",
      width: "170px",
      render: (value) => (
         <Badge variant='outline' className='text-gray-400'>
            {value || "Uncategorized"}
         </Badge>
      ),
   },
   {
      key: "current_qty",
      title: "Current Stock",
      width: "150px",
      render: (value, item) => {
         const variant = value <= item.reorder_level ? "danger" : value >= item.safe_qty_level ? "success" : "default";
         return (
            <span className='mb-0.5 flex items-center gap-2'>
               {value} unit{value > 1 ? "s" : ""}
               {item.has_expiry && item.has_expired_stock && (
                  <ITooltip label='Has Expired Stock'>
                     <AlertCircle className='text-destructive size-4' />
                  </ITooltip>
               )}
            </span>
         );
      },
   },
   {
      key: "price",
      width: "120px",
      title: "Unit Price",
      render: (value) => `PHP ${parseFloat(value).toFixed(2)}`,
   },
   {
      key: "status",
      title: "Status",
      width: "120px",
      render: (value, item) => (
         <Badge
            className='capitalize'
            variant={value === "active" ? "success" : value === "out of stock" ? "destructive" : "secondary"}
         >
            {value}
         </Badge>
      ),
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

   const onStocks = useCallback(
      (item) => {
         dispatch(setOpenStocksModal(true));
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
      [dispatch],
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
      [onViewItem, onEdit, onStocks],
   );

   return (
      <PageLayout
         breadcrumbItems={breadcrumbItems}
         pageTitle={`Inventory ${INVENTORY_ITEMS.title}`}
         route={INVENTORY_ITEMS}
      >
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetInventoryListQuery,
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
                     label: "Add Product",
                     onClick: onCreate,
                     roles: ["admin", "supervisor"],
                  },
                  {
                     label: <Upload className='size-5' />,
                     onClick: onBulkCreate,
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

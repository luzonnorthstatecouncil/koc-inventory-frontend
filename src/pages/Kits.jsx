import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, KITS } from "@/constants/routes";
import { EditIcon, EyeIcon, TrashIcon, Box } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { useDeleteKitMutation, useGetKitListQuery } from "@/features/api/kit";
import KitModals from "@/components/modals/kits/Modals";
import { useDispatch } from "react-redux";
import {
   setOpenCreateModal,
   setOpenEditModal,
   setOpenViewModal,
   setSelectedItem,
} from "@/features/slice/kitSlice";
import { useCallback, useMemo } from "react";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const breadcrumbItems = [{ label: HOME.title }, { label: INVENTORY.title }, { label: KITS.title }];

const columns = [
   {
      key: "sku",
      title: "Kit",
      cellClassName: "font-medium",
      render: (value, item) => (
         <div className='flex flex-col gap-0.5'>
            <span className='font-semibold text-foreground'>{item.name}</span>
            <span className='text-sm text-muted-foreground font-mono tracking-wide'>{value}</span>
         </div>
      ),
   },
   {
      key: "availability",
      title: "Availability",
      width: "170px",
      render: (value) => {
         const isLow = value <= 5;
         const isOut = value === 0;
         return (
            <div className='flex flex-col gap-1'>
               <div className='flex items-center gap-1.5'>
                  <span
                     className={cn(
                        "text-sm font-bold tabular-nums",
                        isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600",
                     )}
                  >
                     {value}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                     kit{value !== 1 ? "s" : ""} available
                  </span>
               </div>
            </div>
         );
      },
   },
   {
      key: "locked_qty",
      title: "Locked",
      width: "100px",
      render: (value) => (
         <div className='flex items-center gap-1.5'>
            <Box className='size-3.5 text-muted-foreground' />
            <span className='text-sm font-medium'>{value || 0}</span>
         </div>
      ),
   },
   {
      key: "price",
      width: "130px",
      title: "Price",
      render: (value) => (
         <span className='font-semibold text-foreground tabular-nums'>
            PHP {parseFloat(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
               ? {
                    label: "Active",
                    className: "bg-emerald-50 text-emerald-700 border-emerald-200 border",
                    dot: "bg-emerald-500",
                 }
               : {
                    label: value || "Inactive",
                    className: "bg-gray-100 text-gray-600 border-gray-200 border",
                    dot: "bg-gray-400",
                 };
         return (
            <span
               className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
                  cfg.className,
               )}
            >
               <span className={cn("size-1.5 rounded-full flex-shrink-0 animate-pulse", cfg.dot)} />
               {cfg.label}
            </span>
         );
      },
   },
];

const kitFilters = [
   {
      key: "status",
      label: "Status",
      options: [
         { value: "active", label: "Active" },
         { value: "inactive", label: "Inactive" },
      ],
   },
];

export default function Kits() {
   const dispatch = useDispatch();
   const [deleteKit] = useDeleteKitMutation();
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

   const onEdit = useCallback(
      (item) => {
         dispatch(setOpenEditModal(true));
         dispatch(setSelectedItem(item));
      },
      [dispatch],
   );

   const onDeleteItem = useCallback(
      async (item) => {
         const confirmed = await confirm({
            title: "Delete Kit",
            message: `Are you sure you want to delete ${item.name}? This action cannot be undone.`,
            variant: "destructive",
         });

         if (!confirmed) return;

         const { success, message } = await exec(deleteKit, { id: item.id });
         if (!success) return;

         toast.success(message);
      },
      [dispatch, confirm, deleteKit, exec],
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
            label: "Edit Kit",
            icon: EditIcon,
            roles: ["admin", "supervisor"],
            action: onEdit,
         },
         {
            key: "delete",
            label: "Delete Kit",
            icon: TrashIcon,
            className: "text-destructive",
            roles: ["admin", "supervisor"],
            action: onDeleteItem,
         },
      ],
      [onViewItem, onEdit, onDeleteItem],
   );

   return (
      <PageLayout
         breadcrumbItems={breadcrumbItems}
         pageTitle={KITS.title}
         pageDescription='Manage your item bundles. Create kits by combining multiple inventory items and track their combined availability.'
         route={KITS}
      >
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetKitListQuery,
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
               filters={kitFilters}
               actions={actions}
               actionButtons={[
                  {
                     label: "Create Kit",
                     onClick: onCreate,
                     roles: ["admin", "supervisor"],
                     icon: Box,
                  },
               ]}
               expandable={true}
               renderExpandedRow={(item) => (
                  <div className='space-y-3'>
                     <h4 className='text-sm font-semibold flex items-center gap-2'>
                        <Box className='size-4 text-primary' />
                        Kit Components
                     </h4>
                     <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                        {item.items?.map((ki) => (
                           <div
                              key={ki.id}
                              className='flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm'
                           >
                              <div className='flex-1 min-w-0'>
                                 <p className='text-sm font-medium truncate'>
                                    {ki.variant?.inventory?.name}
                                 </p>
                                 <p className='text-xs text-muted-foreground truncate'>
                                    {ki.variant?.name || "Standard"}
                                 </p>
                              </div>
                              <div className='flex flex-col items-end'>
                                 <span className='text-xs font-bold text-primary'>
                                    x{ki.quantity}
                                 </span>
                                 <span className='text-[10px] text-muted-foreground'>Required</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
               expandedRowClassName='bg-gray-50/50'
            />

            <KitModals />
         </main>
      </PageLayout>
   );
}

import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, INVENTORY_SUPPLIERS } from "@/constants/routes";
import { EditIcon, EyeIcon, TrashIcon, UserRoundCog } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { Badge } from "@/components/ui/badge";
import { useGetSupplierListQuery, useDeleteSupplierMutation } from "@/features/api/supplier";
import SupplierModals from "@/components/modals/supplier/Modals";
import { useDispatch } from "react-redux";
import {
   setOpenCreateModal,
   setOpenEditModal,
   setOpenViewModal,
   setSelectedSupplier,
} from "@/features/slice/supplierSlice";
import { useCallback, useMemo } from "react";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";

const breadcrumbItems = [{ label: HOME.title }, { label: INVENTORY.title }, { label: INVENTORY_SUPPLIERS.title }];

const columns = [
   {
      key: "name",
      title: "Supplier Name",
      cellClassName: "font-medium",
      width: "400px",
   },
   {
      key: "status",
      title: "Status",
      width: "150px",
      render: (value) => (
         <Badge variant={value === "active" ? "success" : "secondary"}>
            {value === "active" ? "Active" : "Inactive"}
         </Badge>
      ),
   },
];

export default function Suppliers() {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const [deleteSupplier] = useDeleteSupplierMutation();
   const exec = useCatchQuery();

   const onViewSupplier = useCallback(
      (item) => {
         dispatch(setOpenViewModal(true));
         dispatch(setSelectedSupplier(item));
      },
      [dispatch]
   );

   const onCreate = useCallback(() => {
      dispatch(setOpenCreateModal(true));
   }, [dispatch]);

   const onEdit = useCallback(
      (item) => {
         dispatch(setOpenEditModal(true));
         dispatch(setSelectedSupplier(item));
      },
      [dispatch]
   );

   const onDelete = useCallback(
      async (item) => {
         const confirmed = await confirm({
            title: "Delete Supplier",
            message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
         });

         if (!confirmed) return;

         const { success, message } = await exec(deleteSupplier, item.id);
         if (!success) return;

         toast.success(message);
      },
      [confirm, deleteSupplier, exec]
   );

   const actions = useMemo(
      () => [
         {
            key: "view",
            label: "View Details",
            icon: EyeIcon,
            action: onViewSupplier,
         },
         {
            key: "edit",
            label: "Edit Supplier",
            icon: EditIcon,
            action: onEdit,
         },
         // {
         //    key: "delete",
         //    label: "Delete Supplier",
         //    icon: TrashIcon,
         //    className: "text-destructive",
         //    action: onDelete,
         // },
      ],
      [onViewSupplier, onEdit, onDelete]
   );

   return (
      <PageLayout
         breadcrumbItems={breadcrumbItems}
         pageTitle={`Inventory ${INVENTORY_SUPPLIERS.title}`}
         route={INVENTORY_SUPPLIERS}
      >
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetSupplierListQuery,
                  options: {
                     refetchOnMountOrArgChange: true,
                  },
               }}
               columns={columns}
               wrapperClassName='mt-2'
               filterable={true}
               actions={actions}
               actionButtons={[
                  {
                     label: "Add Supplier",
                     onClick: onCreate,
                     icon: <UserRoundCog className='mr-2 h-4 w-4' />,
                  },
               ]}
            />

            <SupplierModals />
         </main>
      </PageLayout>
   );
}


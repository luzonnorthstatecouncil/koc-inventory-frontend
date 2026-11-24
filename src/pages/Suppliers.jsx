import PageLayout from "@/layout/PageLayout";
import { INVENTORY_SUPPLIERS } from "@/constants/routes";
import { EditIcon, EyeIcon } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { useGetSupplierListQuery } from "@/features/api/supplier";
import SupplierModals from "@/components/modals/supplier/Modals";
import { useModalState } from "@/hooks/useModalState";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

const columns = [
   {
      key: "name",
      title: "Supplier",
      render: (value) => <span className='text-sm font-semibold text-foreground'>{value}</span>,
   },
   {
      key: "status",
      title: "Status",
      width: "140px",
      render: (value) => {
         const isActive = value === "active";
         return (
            <span
               className={cn(
                  "inline-flex items-center gap-2 text-sm font-medium",
                  isActive ? "text-neutral-700" : "text-neutral-500",
               )}
            >
               <span className={cn("size-2 rounded-full", isActive ? "bg-emerald-500" : "bg-neutral-300")} aria-hidden='true' />
               {isActive ? "Active" : "Inactive"}
            </span>
         );
      },
   },
];

export default function Suppliers() {
   const modal = useModalState();

   const { open: openModal } = modal;
   const onViewSupplier = useCallback((item) => openModal("view", item), [openModal]);
   const onCreate = useCallback(() => openModal("create"), [openModal]);
   const onEdit = useCallback((item) => openModal("edit", item), [openModal]);

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
      ],
      [onViewSupplier, onEdit],
   );

   return (
      <PageLayout
        
         pageTitle={`Inventory ${INVENTORY_SUPPLIERS.title}`}
         pageDescription='Manage your suppliers. View details, edit information, and keep track of your supplier relationships all in one place.'
         route={INVENTORY_SUPPLIERS}
      >
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetSupplierListQuery,
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
               actions={actions}
               actionButtons={[
                  {
                     label: "Add Supplier",
                     onClick: onCreate,
                  },
               ]}
            />

            <SupplierModals modal={modal} />
         </main>
      </PageLayout>
   );
}

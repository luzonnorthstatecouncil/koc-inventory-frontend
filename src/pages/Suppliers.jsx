import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, INVENTORY_SUPPLIERS } from "@/constants/routes";
import { EditIcon, EyeIcon, TrashIcon, UserRoundCog } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { useGetSupplierListQuery } from "@/features/api/supplier";
import SupplierModals from "@/components/modals/supplier/Modals";
import { useModalState } from "@/hooks/useModalState";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
   "bg-violet-100 text-violet-700 border-violet-200",
   "bg-blue-100 text-blue-700 border-blue-200",
   "bg-emerald-100 text-emerald-700 border-emerald-200",
   "bg-amber-100 text-amber-700 border-amber-200",
   "bg-rose-100 text-rose-700 border-rose-200",
   "bg-cyan-100 text-cyan-700 border-cyan-200",
   "bg-orange-100 text-orange-700 border-orange-200",
   "bg-pink-100 text-pink-700 border-pink-200",
];

function avatarColor(name = "") {
   let hash = 0;
   for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
   return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name = "") {
   return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
}

const columns = [
   {
      key: "name",
      title: "Supplier",
      cellClassName: "font-medium",
      render: (value) => (
         <div className='flex items-center gap-3'>
            <div
               className={cn(
                  "flex-shrink-0 size-9 rounded-xl border flex items-center justify-center font-bold text-sm",
                  avatarColor(value),
               )}
            >
               {initials(value)}
            </div>
            <div className='flex flex-col gap-0.5'>
               <span className='font-semibold text-sm text-foreground'>{value}</span>
               <span className='text-sm text-muted-foreground'>Supplier</span>
            </div>
         </div>
      ),
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
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                  isActive
                     ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                     : "bg-gray-100 text-gray-500 border border-gray-200",
               )}
            >
               <span
                  className={cn(
                     "size-1.5 rounded-full flex-shrink-0",
                     isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400",
                  )}
               />
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
                     icon: <UserRoundCog className='mr-2 h-4 w-4' />,
                  },
               ]}
            />

            <SupplierModals modal={modal} />
         </main>
      </PageLayout>
   );
}

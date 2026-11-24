import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, KITS } from "@/constants/routes";
import { EditIcon, EyeIcon, TrashIcon, Box } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { useDeleteKitMutation, useGetKitListQuery } from "@/features/api/kit";
import KitModals from "@/components/modals/kits/Modals";
import { useModalState } from "@/hooks/useModalState";
import { useCallback, useMemo } from "react";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { priceParser } from "@/helpers/parser";
import { AssembleKitLink } from "@/components/custom/RestockLinks";

const primaryText = "text-sm font-medium text-foreground";
const secondaryText = "text-xs text-neutral-500";

/** Low and out are the only kit states staff act on, so they're the only coloured ones. */
function kitAvailability(value) {
   const n = Number(value) || 0;
   if (n <= 0) return { warning: "None can be made", dot: "bg-red-500", text: "text-red-700" };
   if (n <= 5) return { warning: "Running low", dot: "bg-amber-500", text: "text-amber-700" };
   return { warning: null };
}

const plural = (n, word) => `${word}${n === 1 ? "" : "s"}`;

const columns = [
   {
      key: "sku",
      title: "Kit",
      render: (value, item) => (
         <div className='flex min-w-0 flex-col gap-0.5'>
            <span className={cn(primaryText, "truncate font-semibold")}>{item.name}</span>
            <span className={cn(secondaryText, "truncate tabular-nums")}>{value}</span>
         </div>
      ),
   },
   {
      key: "availability",
      title: "Available",
      width: "170px",
      render: (value, kit) => {
         const n = Number(value) || 0;
         const state = kitAvailability(n);
         return (
            <div className='flex flex-col gap-0.5'>
               <span className={cn(primaryText, "tabular-nums")}>
                  {n.toLocaleString()} <span className='font-medium text-neutral-500'>{plural(n, "kit")}</span>
               </span>
               {state.warning && (
                  <span className='inline-flex flex-wrap items-center gap-x-2 gap-y-0.5'>
                     <span className={cn("inline-flex items-center gap-1.5 text-xs", state.text)}>
                        <span className={cn("size-1.5 rounded-full", state.dot)} aria-hidden='true' />
                        {state.warning}
                     </span>
                     {/* With none possible there's nothing to assemble; otherwise top up the pre-assembled count */}
                     {n > 0 && <AssembleKitLink kitId={kit.id} />}
                  </span>
               )}
            </div>
         );
      },
   },
   {
      key: "locked_qty",
      title: "Pre-assembled",
      width: "130px",
      render: (value) => {
         const n = Number(value) || 0;
         return n > 0 ? (
            <span className={cn(primaryText, "tabular-nums")}>{n.toLocaleString()}</span>
         ) : (
            <span className='text-sm text-neutral-500'>—</span>
         );
      },
   },
   {
      key: "status",
      title: "Status",
      width: "130px",
      render: (value) => {
         const active = value === "active";
         return (
            <span
               className={cn(
                  "inline-flex items-center gap-2 text-sm font-medium capitalize",
                  active ? "text-neutral-700" : "text-neutral-500",
               )}
            >
               <span className={cn("size-2 rounded-full", active ? "bg-emerald-500" : "bg-neutral-300")} aria-hidden='true' />
               {value || "Inactive"}
            </span>
         );
      },
   },
   {
      key: "price",
      title: "Price",
      width: "130px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value) => <span className='text-sm font-semibold text-foreground tabular-nums'>{priceParser(value)}</span>,
   },
];

function KitComponents({ items = [] }) {
   if (!items.length) return <p className='py-1 text-sm text-neutral-500'>No components listed for this kit.</p>;

   return (
      <div className='flex flex-col gap-2'>
         <p className='text-xs font-semibold text-neutral-500'>
            {items.length} {plural(items.length, "component")}
         </p>
         <ul className='grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
            {items.map((ki) => {
               const variant = ki.variant?.name || ki.variant?.variant_name;
               return (
                  <li
                     key={ki.id}
                     className='flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2.5'
                  >
                     <div className='min-w-0'>
                        <p className='truncate text-sm font-medium text-foreground'>{ki.variant?.inventory?.name}</p>
                        <p className='truncate text-xs text-neutral-500'>{variant && variant !== "Default" ? variant : "Standard"}</p>
                     </div>
                     <p className='shrink-0 text-sm font-medium text-foreground tabular-nums'>
                        {ki.quantity}× <span className='font-medium text-neutral-500'>per kit</span>
                     </p>
                  </li>
               );
            })}
         </ul>
      </div>
   );
}

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
   const modal = useModalState();
   const [deleteKit] = useDeleteKitMutation();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();

   const { open: openModal } = modal;
   const onViewItem = useCallback((item) => openModal("view", item), [openModal]);
   const onCreate = useCallback(() => openModal("create"), [openModal]);
   const onEdit = useCallback((item) => openModal("edit", item), [openModal]);

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
      [confirm, deleteKit, exec],
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
               renderExpandedRow={(item) => <KitComponents items={item.items} />}
               expandedRowClassName='bg-neutral-50 hover:bg-neutral-50'
            />

            <KitModals modal={modal} />
         </main>
      </PageLayout>
   );
}

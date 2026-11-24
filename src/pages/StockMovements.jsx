import { useState, useMemo } from "react";
import PageLayout from "@/layout/PageLayout";
import { STOCK_MOVEMENTS } from "@/constants/routes";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, EyeIcon } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import Modal from "@/components/custom/Modal";
import { useGetStockMovementsQuery } from "@/features/api/inventory";
import { dateParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";

const primaryText = "text-sm font-medium text-foreground";
const secondaryText = "text-xs text-neutral-500";

// Direction is information, not a warning: neutral, the word, arrow and sign say which way it went.
const MOVEMENT_TYPES = {
   in: { label: "Stock In", icon: ArrowDownLeft, sign: "+" },
   out: { label: "Stock Out", icon: ArrowUpRight, sign: "−" },
};
const movementType = (type) => MOVEMENT_TYPES[type] ?? { label: "Adjustment", icon: ArrowLeftRight, sign: "±" };

const variantName = (movement) => {
   const name = movement.stock?.variant?.variant_name;
   return name && name !== "Default" ? name : null;
};

const unitOf = (movement) => movement.stock?.inventory?.unit || "pcs";

const columns = [
   {
      key: "created_at",
      title: "Date",
      width: "140px",
      render: (value) => (
         <div className='flex flex-col gap-0.5'>
            <span className={primaryText}>{dateParser(value, "PP")}</span>
            <span className={cn(secondaryText, "tabular-nums")}>{dateParser(value, "p")}</span>
         </div>
      ),
   },
   {
      key: "stock.inventory.sku",
      title: "Product",
      render: (_, movement) => {
         const inventory = movement.stock?.inventory;
         const variant = variantName(movement);
         return (
            <div className='flex min-w-0 flex-col gap-0.5'>
               <span className={cn(primaryText, "truncate font-semibold")}>
                  {inventory?.name || "Unknown item"}
                  {variant && <span className='font-medium text-neutral-500'> · {variant}</span>}
               </span>
               <span className={cn(secondaryText, "truncate tabular-nums")}>{inventory?.sku || "—"}</span>
            </div>
         );
      },
   },
   {
      key: "type",
      title: "Type",
      width: "140px",
      render: (value) => {
         const type = movementType(value);
         const Icon = type.icon;
         return (
            <span className={cn(primaryText, "inline-flex items-center gap-2")}>
               <Icon className='size-4 text-neutral-500' aria-hidden='true' />
               {type.label}
            </span>
         );
      },
   },
   {
      key: "reference_no",
      title: "Details",
      render: (value, movement) => (
         <div className='flex min-w-0 flex-col gap-0.5'>
            <span className={cn(primaryText, "truncate")}>{movement.remarks || "No remarks"}</span>
            <span className={cn(secondaryText, "truncate tabular-nums")}>
               {value}
               {movement.stock?.reference_no && ` · Batch ${movement.stock.reference_no}`}
            </span>
         </div>
      ),
   },
   {
      key: "quantity",
      title: "Qty",
      width: "110px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value, movement) => (
         <span className={cn(primaryText, "tabular-nums")}>
            {movementType(movement.type).sign}
            {Number(value || 0).toLocaleString()} <span className='text-neutral-500'>{unitOf(movement)}</span>
         </span>
      ),
   },
];

const stockFilters = [
   {
      key: "type",
      label: "Movement Type",
      options: [
         { label: "Stock In (Add)", value: "in" },
         { label: "Stock Out (Minus)", value: "out" },
         { label: "Adjustments", value: "adjustments" },
      ],
   },
   {
      key: "created_at",
      label: "Date Range",
      type: "date",
   },
];

function Fact({ label, children }) {
   return (
      <div className='flex items-baseline justify-between gap-4'>
         <dt className='text-sm text-neutral-600'>{label}</dt>
         <dd className='truncate text-sm font-medium text-foreground tabular-nums'>{children}</dd>
      </div>
   );
}

function MovementDetails({ movement }) {
   const inventory = movement.stock?.inventory;
   const variant = variantName(movement);
   const type = movementType(movement.type);
   const Icon = type.icon;

   return (
      <div className='flex flex-col gap-5 text-start'>
         {/* What moved, which way, how many */}
         <section className='flex flex-col gap-1'>
            <p className='inline-flex items-center gap-2 text-sm font-medium text-neutral-600'>
               <Icon className='size-4 text-neutral-500' aria-hidden='true' />
               {type.label}
            </p>
            <p className='text-3xl font-bold tracking-tight text-foreground tabular-nums'>
               {type.sign}
               {Number(movement.quantity || 0).toLocaleString()}{" "}
               <span className='text-base font-medium text-neutral-500'>{unitOf(movement)}</span>
            </p>
            <p className='text-sm text-foreground'>
               <span className='font-semibold'>{inventory?.name || "Unknown item"}</span>
               {variant && <span className='text-neutral-500'> · {variant}</span>}
            </p>
            <p className='text-xs text-neutral-500 tabular-nums'>{inventory?.sku || "—"}</p>
         </section>

         <section className='flex flex-col gap-2'>
            <h3 className='text-xs font-semibold text-neutral-500'>Remarks</h3>
            <p
               className={cn(
                  "rounded-xl border border-neutral-200 px-3.5 py-3 text-sm leading-relaxed",
                  movement.remarks ? "text-foreground" : "text-neutral-500",
               )}
            >
               {movement.remarks || "No remarks for this movement."}
            </p>
         </section>

         <section className='flex flex-col gap-2 rounded-xl bg-neutral-50 px-4 py-3'>
            <h3 className='text-xs font-semibold text-neutral-500'>Details</h3>
            <dl className='flex flex-col gap-1.5'>
               <Fact label='Date'>
                  {dateParser(movement.created_at, "PP")} · {dateParser(movement.created_at, "p")}
               </Fact>
               <Fact label='Processed by'>
                  {movement.processedBy?.full_name || movement.processedBy?.username || "System"}
               </Fact>
               <Fact label='Movement ref.'>{movement.reference_no || "—"}</Fact>
               <Fact label='Batch'>{movement.stock?.reference_no || "—"}</Fact>
            </dl>
         </section>
      </div>
   );
}

export default function StockMovements() {
   const [selectedMovement, setSelectedMovement] = useState(null);
   const [openModal, setOpenModal] = useState(false);

   const openDetails = (movement) => {
      setSelectedMovement(movement);
      setOpenModal(true);
   };

   const actions = useMemo(
      () => [
         {
            key: "view",
            label: "View Details",
            icon: EyeIcon,
            action: (item) => {
               setSelectedMovement(item);
               setOpenModal(true);
            },
         },
      ],
      [],
   );

   return (
      <PageLayout
         pageTitle={STOCK_MOVEMENTS.title}
         pageDescription='Track all inventory additions, subtractions, and adjustment movements over time.'
         route={STOCK_MOVEMENTS}
      >
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetStockMovementsQuery,
                  options: {
                     refetchOnMountOrArgChange: true,
                  },
               }}
               columns={columns}
               wrapperClassName='mt-2'
               filterable
               filters={stockFilters}
               actions={actions}
               onRowClick={openDetails}
            />

            <Modal
               isOpen={openModal}
               onClose={() => setOpenModal(false)}
               title='Movement details'
               size='lg'
               showFooter={true}
               secondaryAction={null}
               primaryAction={{
                  label: "Close",
                  onConfirm: () => setOpenModal(false),
               }}
            >
               {selectedMovement && <MovementDetails movement={selectedMovement} />}
            </Modal>
         </main>
      </PageLayout>
   );
}

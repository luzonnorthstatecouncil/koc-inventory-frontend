import React, { useState, useMemo } from "react";
import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, STOCK_MOVEMENTS } from "@/constants/routes";
import {
   CalendarDays,
   User,
   MessageSquare,
   EyeIcon,
   Activity,
   Hash,
   FileText,
   Warehouse,
} from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import Modal from "@/components/custom/Modal";
import { useGetStockMovementsQuery } from "@/features/api/inventory";
import { dateParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";

const columns = [
   {
      key: "created_at",
      title: "Date & Time",
      width: "220px",
      render: (value) => (
         <span className='inline-flex items-center gap-1.5 text-sm text-muted-foreground'>
            <CalendarDays className='size-3.5' />
            {dateParser(value, "PP p")}
         </span>
      ),
   },
   {
      key: "reference_no",
      title: "Movement Ref",
      width: "160px",
      render: (value) => (
         <span className='inline-flex items-center gap-1.5 font-mono text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg tracking-wider'>
            {value}
         </span>
      ),
   },
   {
      key: "stock.inventory.sku",
      title: "Product",
      render: (_, item) => {
         const inventory = item.stock?.inventory;
         return (
            <div className='flex flex-col'>
               <span className='font-semibold text-sm text-foreground leading-snug'>
                  {inventory?.name || "Unknown Item"}
               </span>
               <span className='text-xs text-muted-foreground font-mono tracking-wide mt-0.5'>
                  {inventory?.sku || "N/A"}
               </span>
            </div>
         );
      },
   },
   {
      key: "stock.variant.variant_name",
      title: "Variant",
      width: "250px",
      render: (_, item) => {
         const variant = item.stock?.variant;
         return (
            <span className='inline-flex items-center text-[11px] font-semibold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded'>
               {variant?.variant_name || "Default"}
            </span>
         );
      },
   },
   {
      key: "type",
      title: "Type",
      width: "120px",
      render: (value) => {
         const { style, label } = (() => {
            if (value === "in")
               return {
                  style: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  label: "Stock In",
               };
            if (value === "out")
               return { style: "bg-rose-50 text-rose-700 border-rose-200", label: "Stock Out" };
            return { style: "bg-amber-50 text-amber-700 border-amber-200", label: "Adjustment" };
         })();
         return (
            <span
               className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border",
                  style,
               )}
            >
               {label}
            </span>
         );
      },
   },
   {
      key: "quantity",
      title: "Qty Changed",
      width: "120px",
      render: (value, item) => {
         const type = item.type;
         const prefix = type === "in" ? "+" : type === "out" ? "-" : "±";
         const qtyStyle =
            type === "in"
               ? "text-emerald-700 bg-emerald-50"
               : type === "out"
                 ? "text-rose-700 bg-rose-50"
                 : "text-amber-700 bg-amber-50";
         return (
            <span
               className={cn(
                  "inline-flex items-center gap-1 text-sm font-bold tabular-nums px-2 py-0.5 rounded-md w-fit",
                  qtyStyle,
               )}
            >
               {prefix}
               {value}{" "}
               <span className='text-xs font-normal text-muted-foreground'>
                  {item.stock?.inventory?.unit || "pcs"}
               </span>
            </span>
         );
      },
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

export default function StockMovements() {
   const [selectedMovement, setSelectedMovement] = useState(null);
   const [openModal, setOpenModal] = useState(false);

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
               onRowClick={(item) => {
                  setSelectedMovement(item);
                  setOpenModal(true);
               }}
            />

            <Modal
               isOpen={openModal}
               onClose={() => setOpenModal(false)}
               title='Movement Details'
               description='View full information for this stock movement.'
               size='lg'
               showFooter={true}
               secondaryAction={null}
               primaryAction={{
                  label: "Close",
                  onConfirm: () => setOpenModal(false),
               }}
            >
               {selectedMovement && (
                  <div className='space-y-4 py-2 text-start'>
                     {/* Product Header */}
                     <div className='bg-slate-50 border border-slate-100 rounded-lg p-4'>
                        <span className='text-xs font-semibold text-primary uppercase tracking-wider block mb-1'>
                           Product Details
                        </span>
                        <h3 className='font-bold text-base sm:text-lg text-foreground'>
                           {selectedMovement.stock?.inventory?.name || "Unknown Item"}
                        </h3>
                        <div className='flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground'>
                           <span className='font-mono bg-white border border-gray-200 px-2 py-0.5 rounded'>
                              SKU: {selectedMovement.stock?.inventory?.sku || "N/A"}
                           </span>
                           {selectedMovement.stock?.variant?.variant_name && (
                              <span className='font-semibold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded'>
                                 Variant: {selectedMovement.stock.variant.variant_name}
                              </span>
                           )}
                           <span className='bg-white border border-gray-200 px-2 py-0.5 rounded'>
                              Unit: {selectedMovement.stock?.inventory?.unit || "pcs"}
                           </span>
                        </div>
                     </div>

                     {/* Two Column details grid */}
                     <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        {/* Movement Type */}
                        <div className='border border-slate-100 rounded-lg p-3 flex flex-col gap-1'>
                           <span className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
                              <Activity className='size-3 text-muted-foreground' /> Movement Type
                           </span>
                           <div>
                              {(() => {
                                 const value = selectedMovement.type;
                                 const { style, label } = (() => {
                                    if (value === "in")
                                       return {
                                          style: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                          label: "Stock In",
                                       };
                                    if (value === "out")
                                       return {
                                          style: "bg-rose-50 text-rose-700 border-rose-200",
                                          label: "Stock Out",
                                       };
                                    return {
                                       style: "bg-amber-50 text-amber-700 border-amber-200",
                                       label: "Adjustment",
                                    };
                                 })();
                                 return (
                                    <span
                                       className={cn(
                                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border mt-1",
                                          style,
                                       )}
                                    >
                                       {label}
                                    </span>
                                 );
                              })()}
                           </div>
                        </div>

                        {/* Quantity Changed */}
                        <div className='border border-slate-100 rounded-lg p-3 flex flex-col gap-1'>
                           <span className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
                              <Hash className='size-3 text-muted-foreground' /> Quantity Changed
                           </span>
                           <div>
                              {(() => {
                                 const type = selectedMovement.type;
                                 const prefix = type === "in" ? "+" : type === "out" ? "-" : "±";
                                 const qtyStyle =
                                    type === "in"
                                       ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                       : type === "out"
                                         ? "text-rose-700 bg-rose-50 border-rose-200"
                                         : "text-amber-700 bg-amber-50 border-amber-200";
                                 return (
                                    <span
                                       className={cn(
                                          "inline-flex items-center gap-1 text-sm font-bold tabular-nums px-2.5 py-0.5 rounded-md border mt-1",
                                          qtyStyle,
                                       )}
                                    >
                                       {prefix}
                                       {selectedMovement.quantity}{" "}
                                       {selectedMovement.stock?.inventory?.unit || "pcs"}
                                    </span>
                                 );
                              })()}
                           </div>
                        </div>

                        {/* Movement Reference */}
                        <div className='border border-slate-100 rounded-lg p-3 flex flex-col gap-1'>
                           <span className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
                              <FileText className='size-3 text-muted-foreground' /> Movement Ref
                           </span>
                           <span className='font-mono text-xs font-bold text-foreground mt-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded w-fit'>
                              {selectedMovement.reference_no}
                           </span>
                        </div>

                        {/* Batch Reference */}
                        <div className='border border-slate-100 rounded-lg p-3 flex flex-col gap-1'>
                           <span className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
                              <Warehouse className='size-3 text-muted-foreground' /> Batch Ref
                           </span>
                           <span className='font-mono text-xs font-bold text-foreground mt-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded w-fit'>
                              {selectedMovement.stock?.reference_no || "N/A"}
                           </span>
                        </div>

                        {/* Processed By */}
                        <div className='border border-slate-100 rounded-lg p-3 flex flex-col gap-1'>
                           <span className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
                              <User className='size-3 text-muted-foreground' /> Processed By
                           </span>
                           <span className='font-semibold text-xs text-foreground mt-1'>
                              {selectedMovement.processedBy?.full_name ||
                                 selectedMovement.processedBy?.username ||
                                 "System"}
                           </span>
                        </div>

                        {/* Date & Time */}
                        <div className='border border-slate-100 rounded-lg p-3 flex flex-col gap-1'>
                           <span className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1'>
                              <CalendarDays className='size-3 text-muted-foreground' /> Date & Time
                           </span>
                           <span className='text-xs text-foreground font-semibold mt-1'>
                              {dateParser(selectedMovement.created_at, "PP p")}
                           </span>
                        </div>
                     </div>

                     {/* Remarks Box */}
                     <div className='border border-slate-100 rounded-lg p-4 bg-slate-50/50'>
                        <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2'>
                           Remarks / Details
                        </span>
                        {selectedMovement.remarks ? (
                           <p className='text-sm text-foreground leading-relaxed italic bg-white border border-gray-150 rounded-lg p-3'>
                              "{selectedMovement.remarks}"
                           </p>
                        ) : (
                           <p className='text-xs text-muted-foreground italic'>
                              No remarks provided for this movement.
                           </p>
                        )}
                     </div>
                  </div>
               )}
            </Modal>
         </main>
      </PageLayout>
   );
}

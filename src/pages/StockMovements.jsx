import PageLayout from "@/layout/PageLayout";
import { HOME, INVENTORY, STOCK_MOVEMENTS } from "@/constants/routes";
import { CalendarDays, User, MessageSquare } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { useGetStockMovementsQuery } from "@/features/api/inventory";
import { dateParser, padwithZero } from "@/helpers/parser";
import { cn } from "@/lib/utils";

const breadcrumbItems = [
   { label: HOME.title },
   { label: INVENTORY.title },
   { label: STOCK_MOVEMENTS.title },
];

const columns = [
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
         const variant = item.stock?.variant;
         return (
            <div className='flex flex-col'>
               <span className='font-semibold text-sm text-foreground leading-snug'>
                  {inventory?.name || "Unknown Item"}
               </span>
               <div className='flex items-center gap-1.5 mt-0.5'>
                  <span className='text-xs text-muted-foreground font-mono tracking-wide'>
                     {inventory?.sku || "N/A"}
                  </span>
                  {variant?.variant_name && variant.variant_name !== "Default" && (
                     <>
                        <span className='text-muted-foreground/40 text-[10px]'>·</span>
                        <span className='text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-100 px-1 py-0.2 rounded'>
                           {variant.variant_name}
                        </span>
                     </>
                  )}
               </div>
            </div>
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
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize border",
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
   {
      key: "stock.reference_no",
      title: "Batch Ref",
      width: "160px",
      render: (value) => (
         <span className='inline-flex items-center gap-1.5 font-mono text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded tracking-wide'>
            {value || "N/A"}
         </span>
      ),
   },
   {
      key: "processedBy.full_name",
      title: "Processed By",
      width: "180px",
      render: (value, item) => (
         <div className='flex items-center gap-1.5 text-xs text-foreground'>
            <User className='size-3.5 text-muted-foreground' />
            <span className='font-medium'>{value || item.processedBy?.username || "System"}</span>
         </div>
      ),
   },
   {
      key: "remarks",
      title: "Remarks",
      render: (value) => (
         <div
            className='flex items-start gap-1 text-xs text-muted-foreground max-w-xs'
            title={value}
         >
            {value ? (
               <>
                  <MessageSquare className='size-3.5 mt-0.5 flex-shrink-0' />
                  <span className='line-clamp-2 leading-tight'>{value}</span>
               </>
            ) : (
               <span className='italic text-muted-foreground/50'>No remarks</span>
            )}
         </div>
      ),
   },
   {
      key: "created_at",
      title: "Date & Time",
      render: (value) => (
         <span className='inline-flex items-center gap-1.5 text-sm text-muted-foreground'>
            <CalendarDays className='size-3.5' />
            {dateParser(value, "PP p")}
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

export default function StockMovements() {
   return (
      <PageLayout
         breadcrumbItems={breadcrumbItems}
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
            />
         </main>
      </PageLayout>
   );
}

import { AlertTriangle } from "lucide-react";
import ReportTabContent from "@/components/custom/ReportTabContent";
import SummaryFooter from "@/components/custom/SummaryFooter";
import { useGetReorderReportQuery } from "@/features/api/inventory";
import { priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { AddStockLink } from "@/components/custom/RestockLinks";

const num = (v) => Number(v || 0).toLocaleString();
const numberCell = { headerClassName: "text-end", cellClassName: "text-end" };

const reorderColumns = [
   {
      key: "product_name",
      title: "Product",
      render: (value, item) => (
         <div className='flex min-w-0 flex-col gap-0.5'>
            <span className='block truncate text-sm font-semibold text-foreground'>{value}</span>
            {item.variant_name && item.variant_name !== "Default" && (
               <span className='block truncate text-xs text-neutral-500'>{item.variant_name}</span>
            )}
         </div>
      ),
   },
   {
      key: "on_hand",
      title: "On hand",
      width: "100px",
      ...numberCell,
      // Red once stock is at or below the reorder level: that's why the row is on this report
      render: (value, item) => {
         const low = Number(value) <= Number(item.reorder_level);
         return (
            <span className={cn("text-sm font-semibold tabular-nums", low ? "text-red-700" : "text-foreground")}>{num(value)}</span>
         );
      },
   },
   {
      key: "reorder_level",
      title: "Reorder at",
      width: "100px",
      ...numberCell,
      render: (value) => <span className='text-sm font-medium text-neutral-600 tabular-nums'>{num(value)}</span>,
   },
   {
      key: "safe_qty_level",
      title: "Safe level",
      width: "100px",
      ...numberCell,
      render: (value) => <span className='text-sm font-medium text-neutral-600 tabular-nums'>{num(value)}</span>,
   },
   {
      key: "order_qty",
      title: "Order",
      width: "100px",
      ...numberCell,
      render: (value) => <span className='text-sm font-semibold text-foreground tabular-nums'>+{num(value)}</span>,
   },
   {
      key: "vendor",
      title: "Vendor",
      width: "150px",
      render: (value) =>
         value ? (
            <span className='block truncate text-sm font-medium text-foreground' title={value}>
               {value}
            </span>
         ) : (
            <span className='text-sm text-neutral-500'>—</span>
         ),
   },
   {
      key: "order_value",
      title: "Order value",
      width: "130px",
      ...numberCell,
      render: (value) => <span className='text-sm font-semibold text-foreground tabular-nums'>{priceParser(value)}</span>,
   },
   {
      key: "restock",
      title: "",
      width: "130px",
      ...numberCell,
      // Straight from the restock list to Add stock: variant, suggested quantity and last supplier filled in
      render: (_, item) => (
         <AddStockLink
            variant={{ id: item.variant_id, variant_name: item.variant_name, current_qty: item.on_hand, safe_qty_level: item.safe_qty_level }}
            quantity={item.order_qty}
            supplierId={item.vendor_id}
         />
      ),
   },
];

export default function ReorderReportTab({ dateRange }) {
   const { data } = useGetReorderReportQuery({ dateRange }, { refetchOnMountOrArgChange: true });

   const totalReorderCost = useMemo(() => {
      if (!data?.data) return 0;
      return data.data.reduce((sum, item) => sum + (parseFloat(item.order_value) || 0), 0);
   }, [data]);

   return (
      <ReportTabContent
         icon={AlertTriangle}
         title='Reorder Report'
         description='Items at or below their reorder level, and how many to order to get back to the safe level.'
         query={{
            useQuery: useGetReorderReportQuery,
            params: { dateRange },
            options: { refetchOnMountOrArgChange: true },
         }}
         columns={reorderColumns}
         emptyMessage='All items are adequately stocked'
         footer={
            <SummaryFooter
               items={[
                  {
                     label: "Total reorder cost",
                     description: `${num(data?.data?.length ?? 0)} item${data?.data?.length === 1 ? "" : "s"} to restock`,
                     value: priceParser(totalReorderCost),
                  },
               ]}
            />
         }
      />
   );
}

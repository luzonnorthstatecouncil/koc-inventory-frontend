import { AlertTriangle } from "lucide-react";
import ReportTabContent from "@/components/custom/ReportTabContent";
import SummaryFooter from "@/components/custom/SummaryFooter";
import { useGetReorderReportQuery } from "@/features/api/inventory";
import { priceParser } from "@/helpers/parser";
import { useMemo } from "react";

export default function ReorderReportTab({ dateRange }) {
   const { data } = useGetReorderReportQuery({ dateRange }, { refetchOnMountOrArgChange: true });

   const totalReorderCost = useMemo(() => {
      if (!data?.data) return 0;
      return data.data.reduce((sum, item) => sum + (parseFloat(item.order_value) || 0), 0);
   }, [data]);

   const reorderColumns = [
      {
         key: "product_name",
         title: "Product",
         render: (value, item) => (
            <div className='flex flex-col gap-0.5'>
               <span className='font-semibold text-sm text-foreground'>{value}</span>
               <span className='inline-flex items-center gap-1'>
                  <span className='px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 text-xs font-semibold'>
                     {item.variant_name}
                  </span>
               </span>
            </div>
         ),
      },
      {
         key: "reorder_level",
         title: "Reorder Lvl",
         width: "90px",
         cellClassName: "text-center",
         render: (value) => (
            <span className='inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold tabular-nums'>
               {value}
            </span>
         ),
      },
      {
         key: "on_hand",
         title: "On Hand",
         width: "90px",
         cellClassName: "text-center",
         render: (value, item) => {
            const isLow = Number(value) <= Number(item.reorder_level);
            return (
               <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${isLow ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                  {value}
               </span>
            );
         },
      },
      {
         key: "safe_qty_level",
         title: "Safe Lvl",
         width: "90px",
         cellClassName: "text-center",
         render: (value) => (
            <span className='text-xs font-semibold text-blue-600 tabular-nums'>{value}</span>
         ),
      },
      {
         key: "order_qty",
         title: "Min Order Qty",
         width: "100px",
         cellClassName: "text-center",
         render: (value) => (
            <span className='inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tabular-nums'>
               +{value}
            </span>
         ),
      },
      {
         key: "vendor",
         title: "Vendor",
         width: "120px",
         render: (value) => (
            <span className='text-xs text-muted-foreground'>{value || "—"}</span>
         ),
      },
      {
         key: "order_value",
         title: "Order Value",
         width: "110px",
         cellClassName: "text-end",
         render: (value) => (
            <span className='text-sm font-bold text-foreground tabular-nums'>{priceParser(value)}</span>
         ),
      },
   ];

   return (
      <ReportTabContent
         icon={AlertTriangle}
         iconColor='text-orange-500'
         title='Reorder Report — Restock Suggestions'
         description='Items hitting minimum threshold — immediate action required'
         query={{
            useQuery: useGetReorderReportQuery,
            params: { dateRange },
            options: { refetchOnMountOrArgChange: true },
         }}
         columns={reorderColumns}
         emptyMessage='✓ All items adequately stocked'
         footer={
            <SummaryFooter
               items={[
                  {
                     label: "Total Reorder Cost",
                     value: priceParser(totalReorderCost),
                     bgColor: "bg-primary/5",
                     borderColor: "border-primary/20",
                     labelColor: "text-primary",
                     valueColor: "text-primary",
                  },
               ]}
            />
         }
      />
   );
}

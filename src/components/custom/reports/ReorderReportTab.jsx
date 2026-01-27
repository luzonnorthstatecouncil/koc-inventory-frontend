import { AlertTriangle, Download } from "lucide-react";
import ReportTabContent from "@/components/custom/ReportTabContent";
import SummaryFooter from "@/components/custom/SummaryFooter";
import { useGetReorderReportQuery } from "@/features/api/inventory";
import { render } from "@fullcalendar/core/preact";
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
         title: "Product Name",
         render: (value, item) => (
            <div className='flex flex-col'>
               <span>{value}</span>
               <span className='text-xs text-muted-foreground'>Variant: {item.variant_name}</span>
            </div>
         ),
      },
      { key: "reorder_level", title: "Reorder Lvl", width: "90px", cellClassName: "text-center" },
      { key: "on_hand", title: "On Hand", width: "90px", cellClassName: "text-center" },
      { key: "safe_qty_level", title: "Safe Lvl", width: "90px", cellClassName: "text-center" },
      {
         key: "order_qty",
         title: "Min Order Qty",
         width: "90px",
         cellClassName: "text-center font-semibold text-blue-600",
      },
      { key: "vendor", title: "Vendor", width: "120px" },
      {
         key: "order_value",
         title: "Order Value",
         width: "100px",
         cellClassName: "text-end",
         render: (value) => priceParser(value),
      },
   ];

   return (
      <ReportTabContent
         icon={AlertTriangle}
         iconColor='text-orange-600'
         title='Reorder Report (Restock Suggestions)'
         description='Items hitting minimum threshold - immediate action required'
         // actionButtons={[
         //    {
         //       label: "Export Order List",
         //       variant: "outline",
         //       size: "sm",
         //       icon: Download,
         //    },
         // ]}
         query={{
            useQuery: useGetReorderReportQuery,
            params: { dateRange },
            options: {
               refetchOnMountOrArgChange: true,
            },
         }}
         columns={reorderColumns}
         emptyMessage='✓ All items adequately stocked'
         footer={
            <SummaryFooter
               items={[
                  {
                     label: "Total Reorder Cost",
                     value: priceParser(totalReorderCost),
                     bgColor: "bg-primary",
                     labelColor: "text-primary-foreground",
                     valueColor: "text-primary-foreground",
                  },
               ]}
            />
         }
      />
   );
}

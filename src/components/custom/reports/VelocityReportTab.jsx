import { Activity, Filter } from "lucide-react";
import ReportTabContent from "@/components/custom/ReportTabContent";
import SummaryFooter from "@/components/custom/SummaryFooter";
import { useGetVelocityReportQuery } from "@/features/api/inventory";
import { dateParser } from "@/helpers/parser";
import { useState } from "react";
import Paragraph from "../Paragraph";

export default function VelocityReportTab({ dateRange }) {
   const velocityColumns = [
      {
         key: "velocity",
         title: "Velocity",
         width: "100px",
         cellClassName: "text-center",
         render: (value) => {
            const velocity = value.toLowerCase();

            return (
               <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                     velocity === "fast"
                        ? "bg-green-100 text-green-700"
                        : velocity === "moderate"
                          ? "bg-blue-100 text-blue-700"
                          : velocity === "slow"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                  }`}
               >
                  {velocity === "fast"
                     ? "Fast"
                     : velocity === "moderate"
                       ? "Moderate"
                       : velocity === "slow"
                         ? "Slow"
                         : "Dead"}
               </span>
            );
         },
      },
      { key: "product_name", title: "Product Name" },
      { key: "category", title: "Category", width: "120px" },
      { key: "sold_30d", title: "Sold (30d)", width: "90px", cellClassName: "text-center font-semibold" },
      { key: "on_hand", title: "On Hand", width: "80px", cellClassName: "text-center" },
      {
         key: "last_update",
         title: "Last Update",
         width: "150px",
         render: (value) => dateParser(value),
      },
   ];

   const [summary, setSummary] = useState({
      fast_movers: 0,
      moderate: 0,
      slow: 0,
      dead: 0,
   });

   return (
      <ReportTabContent
         icon={Activity}
         iconColor='text-blue-600'
         title='Sales Velocity Report'
         description={
            <div>
               <Paragraph className='mb-4'>
                  Identify fast movers vs dead stock - optimize inventory investment.
               </Paragraph>
               <Paragraph className='font-semibold text-primary'>
                  Note: Newly added items will not have velocity data immediately. It may take some time to accumulate
                  enough sales data for accurate velocity classification.
               </Paragraph>
            </div>
         }
         columns={velocityColumns}
         emptyMessage='No sales data available'
         onMount={(data) => {
            if (data?.summary) setSummary(data.summary);
         }}
         query={{
            useQuery: useGetVelocityReportQuery,
            params: { dateRange },
            options: {
               refetchOnMountOrArgChange: true,
            },
         }}
         footer={
            <SummaryFooter
               className='grid-cols-4'
               items={[
                  {
                     label: "Fast Movers",
                     description: "≥5 units/day",
                     value: summary.fast_movers,
                     bgColor: "bg-green-50",
                     borderColor: "border-green-200",
                     labelColor: "text-green-600",
                     valueColor: "text-green-900",
                  },
                  {
                     label: "Moderate",
                     description: "2-4 units/day",
                     value: summary.moderate,
                     bgColor: "bg-blue-50",
                     borderColor: "border-blue-200",
                     labelColor: "text-blue-600",
                     valueColor: "text-blue-900",
                  },
                  {
                     label: "Slow",
                     description: "1 unit/day",
                     value: summary.slow,
                     bgColor: "bg-yellow-50",
                     borderColor: "border-yellow-200",
                     labelColor: "text-yellow-600",
                     valueColor: "text-yellow-900",
                  },
                  {
                     label: "Dead",
                     description: "<1 unit/day",
                     value: summary.dead,
                     bgColor: "bg-red-50",
                     borderColor: "border-red-200",
                     labelColor: "text-red-600",
                     valueColor: "text-red-900",
                  },
               ]}
            />
         }
      />
   );
}

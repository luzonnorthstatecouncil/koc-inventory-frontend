import { Activity } from "lucide-react";
import ReportTabContent from "@/components/custom/ReportTabContent";
import SummaryFooter from "@/components/custom/SummaryFooter";
import { useGetVelocityReportQuery } from "@/features/api/inventory";
import { dateParser } from "@/helpers/parser";
import { useState } from "react";

const VELOCITY_STYLES = {
   fast: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
   moderate: { pill: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
   slow: { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
   dead: { pill: "bg-red-50 text-red-600", dot: "bg-red-500" },
};

function categoryColor(cat = "") {
   const palette = [
      "bg-sky-50 text-sky-700",
      "bg-teal-50 text-teal-700",
      "bg-indigo-50 text-indigo-700",
      "bg-fuchsia-50 text-fuchsia-700",
      "bg-lime-50 text-lime-700",
      "bg-amber-50 text-amber-700",
      "bg-rose-50 text-rose-700",
      "bg-cyan-50 text-cyan-700",
   ];
   let hash = 0;
   for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
   return palette[Math.abs(hash) % palette.length];
}

export default function VelocityReportTab({ dateRange }) {
   const [summary, setSummary] = useState({ fast_movers: 0, moderate: 0, slow: 0, dead: 0 });

   const velocityColumns = [
      {
         key: "velocity",
         title: "Velocity",
         width: "110px",
         cellClassName: "text-center",
         render: (value) => {
            const key = value?.toLowerCase() ?? "dead";
            const { pill, dot } = VELOCITY_STYLES[key] ?? VELOCITY_STYLES.dead;
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            return (
               <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${pill}`}>
                  <span className={`size-1.5 rounded-full ${dot}`} />
                  {label}
               </span>
            );
         },
      },
      {
         key: "product_name",
         title: "Product",
         render: (value) => (
            <span className='font-semibold text-sm text-foreground'>{value}</span>
         ),
      },
      {
         key: "category",
         title: "Category",
         width: "120px",
         render: (value) => (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${categoryColor(value)}`}>
               {value}
            </span>
         ),
      },
      {
         key: "sold_30d",
         title: "Sold (30d)",
         width: "90px",
         cellClassName: "text-center",
         render: (value) => (
            <span className='text-sm font-bold text-emerald-600 tabular-nums'>{value}</span>
         ),
      },
      {
         key: "on_hand",
         title: "On Hand",
         width: "80px",
         cellClassName: "text-center",
         render: (value) => (
            <span className='text-xs font-semibold text-foreground tabular-nums'>{value}</span>
         ),
      },
      {
         key: "last_update",
         title: "Last Update",
         width: "140px",
         render: (value) => (
            <span className='text-xs text-muted-foreground'>{dateParser(value)}</span>
         ),
      },
   ];

   return (
      <ReportTabContent
         icon={Activity}
         iconColor='text-blue-600'
         title='Sales Velocity Report'
         description={
            <span>
               Identify fast movers vs dead stock.{" "}
               <span className='text-primary font-semibold'>
                  Note: Newly added items may take time to accumulate velocity data.
               </span>
            </span>
         }
         columns={velocityColumns}
         emptyMessage='No sales data available'
         onMount={(data) => {
            if (data?.summary) setSummary(data.summary);
         }}
         query={{
            useQuery: useGetVelocityReportQuery,
            params: { dateRange },
            options: { refetchOnMountOrArgChange: true },
         }}
         footer={
            <SummaryFooter
               className='grid-cols-4'
               items={[
                  {
                     label: "Fast Movers",
                     description: "≥5 units/day",
                     value: summary.fast_movers,
                     bgColor: "bg-emerald-50",
                     borderColor: "border-emerald-200",
                     labelColor: "text-emerald-700",
                     valueColor: "text-emerald-900",
                  },
                  {
                     label: "Moderate",
                     description: "2–4 units/day",
                     value: summary.moderate,
                     bgColor: "bg-blue-50",
                     borderColor: "border-blue-200",
                     labelColor: "text-blue-700",
                     valueColor: "text-blue-900",
                  },
                  {
                     label: "Slow",
                     description: "1 unit/day",
                     value: summary.slow,
                     bgColor: "bg-amber-50",
                     borderColor: "border-amber-200",
                     labelColor: "text-amber-700",
                     valueColor: "text-amber-900",
                  },
                  {
                     label: "Dead Stock",
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

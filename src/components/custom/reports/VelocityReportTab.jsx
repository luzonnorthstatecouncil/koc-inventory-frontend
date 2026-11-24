import { Activity } from "lucide-react";
import ReportTabContent from "@/components/custom/ReportTabContent";
import SummaryFooter from "@/components/custom/SummaryFooter";
import { useGetVelocityReportQuery } from "@/features/api/inventory";
import { dateParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Fast is the only "good" colour; moderate is plain; slow and dead are the ones to act on.
const VELOCITY = {
   fast: { label: "Fast", dot: "bg-emerald-500", text: "text-neutral-700" },
   moderate: { label: "Moderate", dot: "bg-neutral-300", text: "text-neutral-700" },
   slow: { label: "Slow", dot: "bg-amber-500", text: "text-amber-700" },
   dead: { label: "Dead", dot: "bg-red-500", text: "text-red-700" },
};

const velocityColumns = [
   {
      key: "velocity",
      title: "Velocity",
      width: "120px",
      render: (value) => {
         const v = VELOCITY[value?.toLowerCase()] ?? VELOCITY.dead;
         return (
            <span className={cn("inline-flex items-center gap-2 text-sm font-medium", v.text)}>
               <span className={cn("size-2 rounded-full", v.dot)} aria-hidden='true' />
               {v.label}
            </span>
         );
      },
   },
   {
      key: "product_name",
      title: "Product",
      render: (value, item) => (
         <div className='flex min-w-0 flex-col gap-0.5'>
            <span className='block truncate text-sm font-semibold text-foreground'>{value}</span>
            {item.category && <span className='block truncate text-xs text-neutral-500'>{item.category}</span>}
         </div>
      ),
   },
   {
      key: "sold_30d",
      title: "Sold (30d)",
      width: "100px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value) => <span className='text-sm font-medium text-foreground tabular-nums'>{Number(value || 0).toLocaleString()}</span>,
   },
   {
      key: "on_hand",
      title: "On hand",
      width: "90px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value) => <span className='text-sm font-medium text-foreground tabular-nums'>{Number(value || 0).toLocaleString()}</span>,
   },
   {
      key: "last_update",
      title: "Last update",
      width: "140px",
      render: (value) =>
         value ? (
            <div className='flex flex-col gap-0.5'>
               <span className='text-sm font-medium text-foreground'>{dateParser(value, "PP")}</span>
               <span className='text-xs text-neutral-500 tabular-nums'>{dateParser(value, "p")}</span>
            </div>
         ) : (
            <span className='text-sm text-neutral-500'>—</span>
         ),
   },
];

export default function VelocityReportTab({ dateRange }) {
   const [summary, setSummary] = useState({ fast_movers: 0, moderate: 0, slow: 0, dead: 0 });

   return (
      <ReportTabContent
         icon={Activity}
         title='Sales Velocity Report'
         description='Fast movers vs. dead stock over the last 30 days. Newly added items take time to build up velocity.'
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
               items={[
                  { label: "Fast movers", description: "≥5 units/day", value: summary.fast_movers },
                  { label: "Moderate", description: "2–4 units/day", value: summary.moderate },
                  {
                     label: "Slow",
                     description: "1 unit/day",
                     value: summary.slow,
                     tone: summary.slow > 0 ? "warning" : "default",
                  },
                  {
                     label: "Dead stock",
                     description: "<1 unit/day",
                     value: summary.dead,
                     tone: summary.dead > 0 ? "danger" : "default",
                  },
               ]}
            />
         }
      />
   );
}

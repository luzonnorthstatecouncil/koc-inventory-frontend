import { useState } from "react";
import { Clock } from "lucide-react";
import ReportTabContent from "@/components/custom/ReportTabContent";
import Modal from "@/components/custom/Modal";
import ShiftReport from "@/components/custom/ShiftReport";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetShiftReportQuery, useGetShiftsQuery } from "@/features/api/shift";
import { dateParser, priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";

function ShiftReportModal({ shiftId, onClose }) {
   const { data, isFetching } = useGetShiftReportQuery(shiftId, { refetchOnMountOrArgChange: true });
   return (
      <Modal isOpen onClose={onClose} title={`Shift #${shiftId}`} size='lg' secondaryAction={null} primaryAction={{ label: "Done", onConfirm: onClose }}>
         {isFetching || !data ? <Skeleton className='h-72 w-full rounded-xl' /> : <ShiftReport report={data} />}
      </Modal>
   );
}

const dash = <span className='text-neutral-500'>—</span>;
const money = (v) => (v === null || v === undefined ? dash : priceParser(v));
const moneyCol = { width: "120px", headerClassName: "text-end", cellClassName: "text-end tabular-nums" };

/** Every cashier shift with its cash count; open one to see or reprint its X/Z reading. */
export default function ShiftsReportTab() {
   const [viewing, setViewing] = useState(null);

   const columns = [
      {
         key: "id",
         title: "Shift",
         render: (value, item) => (
            <div className='flex min-w-0 flex-col gap-0.5'>
               <span className='block truncate text-sm font-semibold text-foreground'>
                  #{value} · {item.user?.full_name}
               </span>
               <span className='block truncate text-xs text-neutral-500 tabular-nums'>
                  {dateParser(item.opened_at, "PP")} · {dateParser(item.opened_at, "p")}
               </span>
            </div>
         ),
      },
      {
         key: "status",
         title: "Status",
         width: "110px",
         render: (value, item) => {
            const open = value === "open";
            return (
               <span
                  className={cn("inline-flex items-center gap-2 text-sm font-medium", open ? "text-neutral-700" : "text-neutral-500")}
                  title={!open && item.closedBy ? `Closed by ${item.closedBy.full_name}` : undefined}
               >
                  <span className={cn("size-2 rounded-full", open ? "bg-emerald-500" : "bg-neutral-300")} aria-hidden='true' />
                  {open ? "Open" : "Closed"}
               </span>
            );
         },
      },
      { key: "opening_float", title: "Opening", ...moneyCol, render: (v) => priceParser(v) },
      { key: "expected_cash", title: "Expected", ...moneyCol, render: money },
      { key: "counted_cash", title: "Counted", ...moneyCol, render: money },
      {
         key: "cash_variance",
         title: "Over / short",
         ...moneyCol,
         width: "130px",
         // Short is a problem (red), over needs a look (amber), balanced is just normal
         render: (v) => {
            if (v === null || v === undefined) return dash;
            const n = Number(v);
            const label = n === 0 ? "Balanced" : `${n > 0 ? "+" : "−"}${priceParser(Math.abs(n))}`;
            return (
               <span
                  className={cn(
                     "text-sm font-semibold tabular-nums",
                     n === 0 ? "text-neutral-500" : n < 0 ? "text-red-700" : "text-amber-700",
                  )}
               >
                  {label}
               </span>
            );
         },
      },
      {
         key: "view",
         title: "",
         width: "100px",
         cellClassName: "text-end",
         render: (_, item) => (
            <button
               type='button'
               onClick={() => setViewing(item.id)}
               className='text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary'
            >
               {item.status === "open" ? "X reading" : "Z reading"}
            </button>
         ),
      },
   ];

   return (
      <>
         <ReportTabContent
            icon={Clock}
            title='Shifts'
            description='Opening cash, what each drawer should hold, and what was counted at close.'
            query={{ useQuery: useGetShiftsQuery, params: {}, options: { refetchOnMountOrArgChange: true } }}
            columns={columns}
            searchable={false}
            emptyMessage='No shifts yet'
         />
         {viewing && <ShiftReportModal shiftId={viewing} onClose={() => setViewing(null)} />}
      </>
   );
}

import DataTable from "@/components/custom/Datatable";
import { dateParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";

const primaryText = "text-sm font-medium text-foreground";
const secondaryText = "text-xs text-neutral-500";
const EXPIRY_WARNING_DAYS = 30;

const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

const DateCell = ({ value }) =>
   value ? (
      <div className='flex flex-col gap-0.5'>
         <span className={primaryText}>{dateParser(value, "PP")}</span>
         <span className={cn(secondaryText, "tabular-nums")}>{dateParser(value, "p")}</span>
      </div>
   ) : (
      <span className='text-sm text-neutral-500'>—</span>
   );

const MOVEMENT_TYPES = {
   in: { label: "In", icon: ArrowDownLeft, sign: "+" },
   out: { label: "Out", icon: ArrowUpRight, sign: "−" },
};

const movementColumns = [
   {
      key: "type",
      title: "Type",
      width: "100px",
      // Direction is information, not a warning: neutral, the word and sign say which way it went.
      render: (value) => {
         const type = MOVEMENT_TYPES[value] ?? { label: "Adjusted", icon: ArrowLeftRight };
         const Icon = type.icon;
         return (
            <span className={cn(primaryText, "inline-flex items-center gap-2")}>
               <Icon className='size-4 text-neutral-400' aria-hidden='true' />
               {type.label}
            </span>
         );
      },
   },
   {
      key: "remarks",
      title: "Details",
      render: (value, movement) => (
         <div className='flex min-w-0 flex-col gap-0.5'>
            <span className={cn(primaryText, "truncate")}>{value || "Received stock"}</span>
            {movement.reference_no && (
               <span className={cn(secondaryText, "truncate tabular-nums")}>{movement.reference_no}</span>
            )}
         </div>
      ),
   },
   {
      key: "created_at",
      width: "140px",
      title: "Date",
      render: (value) => <DateCell value={value} />,
   },
   {
      key: "quantity",
      width: "90px",
      title: "Qty",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value, movement) => (
         <span className={cn(primaryText, "tabular-nums")}>
            {MOVEMENT_TYPES[movement?.type]?.sign ?? ""}
            {Number(value || 0).toLocaleString()}
         </span>
      ),
   },
];

function Fact({ label, children, className }) {
   return (
      <div className={cn("flex flex-col gap-1 bg-white px-4 py-3", className)}>
         <dt className='text-xs text-neutral-500'>{label}</dt>
         <dd className='text-sm font-medium text-foreground'>{children}</dd>
      </div>
   );
}

/** Expiry in words: red once expired, amber inside the warning window, neutral otherwise. */
function expiryState(expiresAt) {
   if (!expiresAt) return null;
   const days = differenceInCalendarDays(new Date(expiresAt), new Date());
   if (days < 0) return { note: "Expired", text: "text-red-700", dot: "bg-red-500" };
   if (days <= EXPIRY_WARNING_DAYS)
      return { note: days === 0 ? "Expires today" : `Expires in ${plural(days, "day")}`, text: "text-amber-700", dot: "bg-amber-500" };
   return { note: `${plural(days, "day")} left`, text: "text-neutral-500" };
}

export default function View({ item }) {
   const variant = item?.variant?.variant_name;
   const expiry = expiryState(item?.expires_at);
   const batchQty = Number(item?.batch_quantity) || 0;
   const remaining = item?.current_quantity == null ? null : Number(item.current_quantity) || 0;

   return (
      <div className='flex flex-col gap-4'>
         <header className='flex flex-col gap-0.5'>
            <p className='text-base font-semibold text-foreground'>
               {item?.inventory?.name}
               {variant && variant !== "Default" && <span className='font-medium text-neutral-500'> · {variant}</span>}
            </p>
            <p className={cn(secondaryText, "tabular-nums")}>
               {item?.inventory?.sku} · Batch {item?.reference_no}
            </p>
            {item?.inventory?.description && <p className='mt-1 text-sm text-neutral-600'>{item.inventory.description}</p>}
         </header>

         <dl className='grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3'>
            <Fact label='Received'>
               <span className='tabular-nums'>
                  {batchQty.toLocaleString()} <span className='font-medium text-neutral-500'>{item?.inventory?.unit}</span>
               </span>
            </Fact>
            <Fact label='Remaining'>
               {remaining == null ? (
                  <span className='font-medium text-neutral-500'>—</span>
               ) : (
                  <span className='tabular-nums'>
                     {remaining.toLocaleString()} <span className='font-medium text-neutral-500'>{item?.inventory?.unit}</span>
                  </span>
               )}
            </Fact>
            <Fact label='Date received'>
               {item?.received_at ? (
                  <span className='tabular-nums'>
                     {dateParser(item.received_at, "PP")}{" "}
                     <span className='font-medium text-neutral-500'>{dateParser(item.received_at, "p")}</span>
                  </span>
               ) : (
                  "—"
               )}
            </Fact>
            <Fact label='Expires'>
               {expiry ? (
                  <span className='flex flex-col gap-0.5'>
                     <span className='tabular-nums'>{dateParser(item.expires_at, "PP")}</span>
                     <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", expiry.text)}>
                        {expiry.dot && <span className={cn("size-1.5 rounded-full", expiry.dot)} aria-hidden='true' />}
                        {expiry.note}
                     </span>
                  </span>
               ) : (
                  <span className='font-medium text-neutral-500'>No expiry</span>
               )}
            </Fact>
            <Fact label='Supplier' className='sm:col-span-2'>
               {item?.supplier?.name ?? <span className='font-medium text-neutral-500'>—</span>}
            </Fact>
         </dl>

         <section className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold text-foreground'>
               Movements <span className='font-medium text-neutral-500'>· {(item?.movements || []).length}</span>
            </h3>
            <DataTable
               columns={movementColumns}
               searchable={false}
               filterable={false}
               serverSide={false}
               tableData={item?.movements || []}
               initialPageSize={5}
               showPageSizeSelector={false}
               tableHeaderClassName='hidden'
               emptyMessage='No movements recorded yet.'
            />
         </section>
      </div>
   );
}

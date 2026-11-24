import { useState } from "react";
import { format } from "date-fns";
import { Receipt } from "lucide-react";
import { useGetSalesReportQuery } from "@/features/api/order";
import { priceParser } from "@/helpers/parser";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const today = () => format(new Date(), "yyyy-MM-dd");
const dateField =
   "h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm tabular-nums outline-none focus:border-primary";

function Figure({ label, value, sub, tone }) {
   return (
      <div className='rounded-xl border border-neutral-200 bg-white px-4 py-3'>
         <p className='text-xs text-neutral-500'>{label}</p>
         <p className={cn("text-xl font-bold tabular-nums text-foreground", tone === "bad" && "text-red-700")}>{value}</p>
         {sub && <p className='text-xs text-neutral-500 tabular-nums'>{sub}</p>}
      </div>
   );
}

/** A compact table: columns are [{ key, title, align, render }]. */
function Table({ title, columns, rows, empty = "Nothing in this period" }) {
   return (
      <section className='rounded-xl border border-neutral-200 bg-white overflow-hidden'>
         <h3 className='border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-foreground'>{title}</h3>
         {rows.length === 0 ? (
            <p className='px-4 py-6 text-sm text-neutral-500 text-center'>{empty}</p>
         ) : (
            <div className='overflow-x-auto'>
               <table className='w-full text-sm'>
                  <thead>
                     <tr className='border-b border-neutral-100 text-xs text-neutral-500'>
                        {columns.map((c) => (
                           <th key={c.key} className={cn("px-4 py-2 font-semibold", c.align === "right" ? "text-right" : "text-left")}>
                              {c.title}
                           </th>
                        ))}
                     </tr>
                  </thead>
                  <tbody className='divide-y divide-neutral-100'>
                     {rows.map((row, i) => (
                        <tr key={i}>
                           {columns.map((c) => (
                              <td key={c.key} className={cn("px-4 py-2.5 font-medium text-foreground tabular-nums", c.align === "right" ? "text-right" : "text-left")}>
                                 {c.render ? c.render(row[c.key], row) : row[c.key]}
                              </td>
                           ))}
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </section>
   );
}

const money = (v) => priceParser(v);
const count = (v) => Number(v).toLocaleString();

/**
 * Daily sales report: gross, refunds and net for a date range, then by day, payment method,
 * cashier, item and category. Voided sales are counted separately and not in sales.
 */
export default function SalesReportTab() {
   const [range, setRange] = useState({ dateFrom: today(), dateTo: today() });
   const { data, isFetching, isError, error } = useGetSalesReportQuery(range, { refetchOnMountOrArgChange: true });
   const s = data?.summary;

   const setDate = (key) => (e) => {
      const value = e.target.value;
      if (!value) return;
      setRange((prev) => {
         const next = { ...prev, [key]: value };
         // Keep the range valid when one end moves past the other
         if (next.dateFrom > next.dateTo) next[key === "dateFrom" ? "dateTo" : "dateFrom"] = value;
         return next;
      });
   };

   return (
      <div className='flex flex-col gap-4'>
         <div className='flex flex-wrap items-end justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3'>
            <div className='flex items-start gap-3'>
               <Receipt className='mt-0.5 size-4 shrink-0 text-neutral-500' aria-hidden='true' />
               <div>
                  <p className='text-sm font-semibold text-foreground'>Sales Report</p>
                  <p className='text-xs text-neutral-500'>Net of refunds. Refunds count on the day they were made.</p>
               </div>
            </div>
            <div className='flex items-end gap-2'>
               <label className='flex flex-col gap-1 text-xs font-semibold text-neutral-500'>
                  From
                  <input type='date' className={dateField} value={range.dateFrom} max={today()} onChange={setDate("dateFrom")} />
               </label>
               <label className='flex flex-col gap-1 text-xs font-semibold text-neutral-500'>
                  To
                  <input type='date' className={dateField} value={range.dateTo} max={today()} onChange={setDate("dateTo")} />
               </label>
               <button
                  type='button'
                  className='h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                  onClick={() => setRange({ dateFrom: today(), dateTo: today() })}
               >
                  Today
               </button>
            </div>
         </div>

         {isError ? (
            <p className='text-sm text-red-700'>{error?.data?.message || "Couldn't load the sales report."}</p>
         ) : !s ? (
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
               {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className='h-20 rounded-xl' />
               ))}
            </div>
         ) : (
            <div className={cn("flex flex-col gap-4 transition-opacity", isFetching && "opacity-60")}>
               <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
                  <Figure label='Net sales' value={money(s.net_sales)} sub={`${count(s.units_sold)} items sold`} />
                  <Figure label='Gross sales' value={money(s.gross_sales)} sub={`${count(s.sales_count)} sales · avg ${money(s.average_sale)}`} />
                  <Figure label='Refunds' value={money(s.refunds)} sub={`${count(s.refunds_count)} refunds`} />
                  <Figure label='Voided sales' value={money(s.voids)} sub={`${count(s.voids_count)} voided`} />
               </div>

               <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                  <Table
                     title='By payment method'
                     rows={s.by_payment_method}
                     columns={[
                        { key: "method", title: "Method", render: (v) => <span className='capitalize'>{v}</span> },
                        { key: "sales_count", title: "Sales", align: "right", render: count },
                        { key: "gross_sales", title: "Gross", align: "right", render: money },
                        { key: "refunds", title: "Refunds", align: "right", render: money },
                        { key: "net_sales", title: "Net", align: "right", render: money },
                     ]}
                  />
                  <Table
                     title='By cashier'
                     rows={data.by_cashier}
                     columns={[
                        { key: "full_name", title: "Cashier" },
                        { key: "sales_count", title: "Sales", align: "right", render: count },
                        { key: "refunds", title: "Refunds", align: "right", render: (v, r) => `${money(v)} (${r.refunds_count})` },
                        { key: "voids_count", title: "Voids", align: "right", render: count },
                        { key: "net_sales", title: "Net", align: "right", render: money },
                     ]}
                  />
               </div>

               {data.by_day.length > 1 && (
                  <Table
                     title='By day'
                     rows={data.by_day}
                     columns={[
                        { key: "date", title: "Date" },
                        { key: "sales_count", title: "Sales", align: "right", render: count },
                        { key: "gross_sales", title: "Gross", align: "right", render: money },
                        { key: "refunds", title: "Refunds", align: "right", render: money },
                        { key: "net_sales", title: "Net", align: "right", render: money },
                     ]}
                  />
               )}

               <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
                  <div className='xl:col-span-2'>
                     <Table
                        title='By item'
                        rows={data.by_item}
                        columns={[
                           {
                              key: "item_name",
                              title: "Item",
                              render: (v, r) => (
                                 <span className='font-medium'>
                                    {v}
                                    {r.variant_name && <span className='text-neutral-500'> · {r.variant_name}</span>}
                                    {r.kit_id && <span className='ml-1.5 text-xs text-neutral-500'>Kit</span>}
                                 </span>
                              ),
                           },
                           { key: "units", title: "Units", align: "right", render: count },
                           { key: "net_sales", title: "Net sales", align: "right", render: money },
                        ]}
                     />
                  </div>
                  <Table
                     title='By category'
                     rows={data.by_category}
                     columns={[
                        { key: "category", title: "Category" },
                        { key: "units", title: "Units", align: "right", render: count },
                        { key: "net_sales", title: "Net", align: "right", render: money },
                     ]}
                  />
               </div>
            </div>
         )}
      </div>
   );
}

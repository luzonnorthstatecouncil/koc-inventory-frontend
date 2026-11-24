import DataTable from "@/components/custom/Datatable";
import { stockState } from "@/components/custom/PointOfSaleItem";
import { AddStockLink } from "@/components/custom/RestockLinks";
import { mostUrgentVariant } from "@/helpers/restock";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlushExpiredStocksMutation } from "@/features/api/inventory";
import { setSelectedStock } from "@/features/slice/inventorySlice";
import { useConfirmation } from "@/helpers/confirmAction";
import { dateParser } from "@/helpers/parser";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, isPast } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const primaryText = "text-sm font-medium text-foreground";
const secondaryText = "text-xs text-neutral-500";
const EXPIRY_WARNING_DAYS = 30;

const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

const STOCK_TONE = {
   ok: { dot: "bg-emerald-500", text: "text-neutral-600", label: "In stock" },
   low: { dot: "bg-amber-500", text: "text-amber-700", label: "Low stock" },
   critical: { dot: "bg-red-500", text: "text-red-700", label: "Reorder now" },
   out: { dot: "bg-red-500", text: "text-red-700", label: "Out of stock" },
};

const isBatchExpired = (stock) => Boolean(stock.has_expiry && stock.expires_at && !stock.archived_at && isPast(stock.expires_at));

/** Expiry in words: red once expired, amber inside the warning window, neutral otherwise. */
function expiryState(stock) {
   if (!stock.has_expiry || !stock.expires_at) return null;
   if (stock.archived_at) return { label: dateParser(stock.expires_at, "PP"), text: "text-neutral-500" };
   const days = differenceInCalendarDays(new Date(stock.expires_at), new Date());
   if (days < 0) return { label: "Expired", note: dateParser(stock.expires_at, "PP"), text: "text-red-700", dot: "bg-red-500" };
   if (days <= EXPIRY_WARNING_DAYS)
      return {
         label: days === 0 ? "Expires today" : `Expires in ${plural(days, "day")}`,
         note: dateParser(stock.expires_at, "PP"),
         text: "text-amber-700",
         dot: "bg-amber-500",
      };
   return { label: dateParser(stock.expires_at, "PP"), text: "text-foreground" };
}

const DateCell = ({ value }) =>
   value ? (
      <div className='flex flex-col gap-0.5'>
         <span className={primaryText}>{dateParser(value, "PP")}</span>
         <span className={cn(secondaryText, "tabular-nums")}>{dateParser(value, "p")}</span>
      </div>
   ) : (
      <span className='text-sm text-neutral-500'>—</span>
   );

const buildBatchColumns = (hasExpiry) => [
   {
      key: "reference_no",
      title: "Batch",
      render: (value, stock) => {
         const archived = Boolean(stock.archived_at);
         return (
            <div className='flex flex-col gap-0.5'>
               <span className={cn(primaryText, "tabular-nums", archived && "text-neutral-500 line-through")}>{value}</span>
               {archived && (
                  <span className={secondaryText}>Archived {dateParser(stock.archived_at, "PP")}</span>
               )}
            </div>
         );
      },
   },
   {
      key: "received_at",
      title: "Received",
      width: "140px",
      render: (value) => <DateCell value={value} />,
   },
   ...(hasExpiry
      ? [
           {
              key: "expires_at",
              title: "Expires",
              width: "160px",
              render: (_, stock) => {
                 const state = expiryState(stock);
                 if (!state) return <span className='text-sm text-neutral-500'>—</span>;
                 return (
                    <div className='flex flex-col gap-0.5'>
                       <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", state.text)}>
                          {state.dot && <span className={cn("size-1.5 rounded-full", state.dot)} aria-hidden='true' />}
                          {state.label}
                       </span>
                       {state.note && <span className={cn(secondaryText, "tabular-nums")}>{state.note}</span>}
                    </div>
                 );
              },
           },
        ]
      : []),
   {
      key: "current_quantity",
      title: "Remaining",
      width: "120px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value, stock) => {
         const left = Number(value) || 0;
         const total = Number(stock.batch_quantity) || 0;
         return (
            <span className={cn(primaryText, "tabular-nums", stock.archived_at && "text-neutral-500")}>
               {left.toLocaleString()} <span className='font-medium text-neutral-500'>of {total.toLocaleString()}</span>
            </span>
         );
      },
   },
];

const MOVEMENT_TYPES = {
   in: { label: "In", icon: ArrowDownLeft, sign: "+" },
   out: { label: "Out", icon: ArrowUpRight, sign: "−" },
};

const movementColumns = [
   {
      key: "type",
      title: "Type",
      width: "110px",
      // Direction is information, not a warning: neutral, the word and sign say which way it went.
      render: (value) => {
         const type = MOVEMENT_TYPES[value] ?? { label: "Adjusted", icon: ArrowLeftRight, sign: "" };
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
            {movement.stock_reference_no && (
               <span className={cn(secondaryText, "truncate tabular-nums")}>Batch {movement.stock_reference_no}</span>
            )}
         </div>
      ),
   },
   {
      key: "created_at",
      title: "Date",
      width: "140px",
      render: (value) => <DateCell value={value} />,
   },
   {
      key: "quantity",
      title: "Qty",
      width: "90px",
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

function SummaryCell({ label, children }) {
   return (
      <div className='flex flex-col gap-1 bg-white px-4 py-3'>
         <p className='text-xs text-neutral-500'>{label}</p>
         {children}
      </div>
   );
}

export default function ViewStocks({ item }) {
   const dispatch = useDispatch();
   const [flushExpired] = useFlushExpiredStocksMutation();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const [view, setView] = useState("batches");

   const stocks = useMemo(
      () => (item?.stocks ?? []).map((stock) => ({ ...stock, has_expiry: item?.has_expiry })),
      [item?.stocks, item?.has_expiry],
   );
   const movements = item?.all_movements ?? [];

   const summary = useMemo(() => {
      const variants = item?.variants ?? [];
      const reorder = variants.length ? Math.min(...variants.map((v) => v.reorder_level || 0)) : item?.reorder_level || 0;
      const safe = variants.length ? Math.min(...variants.map((v) => v.safe_qty_level || 0)) : item?.safe_qty_level || 0;
      const max = variants.length ? Math.max(...variants.map((v) => v.max_qty_level || 0)) : item?.max_qty_level || 0;
      const active = stocks.filter((s) => !s.archived_at);
      const expired = active.filter(isBatchExpired);
      const expiringSoon = active.filter((s) => {
         const state = expiryState(s);
         return state?.dot === "bg-amber-500";
      });
      return {
         qty: Number(item?.current_qty) || 0,
         reorder,
         safe,
         max,
         activeBatches: active.length,
         archivedBatches: stocks.length - active.length,
         expired,
         expiredUnits: expired.reduce((sum, s) => sum + (Number(s.current_quantity) || 0), 0),
         expiringSoon: expiringSoon.length,
      };
   }, [item, stocks]);

   const onFlushExpired = useCallback(async () => {
      const expiredStocks = item?.stocks?.filter((stock) => isPast(stock.expires_at));
      const totalExpiredStocks = expiredStocks?.reduce((acc, stock) => acc + stock.batch_quantity, 0) || 0;

      if (!expiredStocks?.length) return;

      const confirmed = await confirm({
         title: "Flush Expired Stocks",
         message: `Are you sure you want to flush ${expiredStocks?.length} expired stock${
            expiredStocks?.length > 1 ? "s" : ""
         } with a total of ${totalExpiredStocks} stocks from this item?`,
         variant: "destructive",
      });

      if (!confirmed) return;

      const { success, message } = await exec(flushExpired, { expired_stocks: expiredStocks });
      if (!success) return;

      dispatch(setSelectedStock(null));
      toast.success(message);
   }, [confirm, dispatch, exec, flushExpired, item?.stocks]);

   const tone = STOCK_TONE[stockState(summary.qty, summary.reorder, summary.safe).tone];
   const urgentVariant = mostUrgentVariant(item?.variants ?? []);
   const batchColumns = useMemo(() => buildBatchColumns(Boolean(item?.has_expiry)), [item?.has_expiry]);

   return (
      <ScrollArea className='relative flex max-h-130 w-full flex-col'>
         <div className='flex flex-col gap-4 pr-1'>
            <div className='grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3'>
               <SummaryCell label='Current stock'>
                  <p className='text-xl font-semibold text-foreground tabular-nums'>
                     {summary.qty.toLocaleString()}{" "}
                     <span className='text-sm font-medium text-neutral-500'>{summary.qty === 1 ? "unit" : "units"}</span>
                  </p>
                  <p className={cn("inline-flex items-center gap-1.5 text-xs", tone.text)}>
                     <span className={cn("size-1.5 rounded-full", tone.dot)} aria-hidden='true' />
                     {tone.label}
                  </p>
                  {/* Below the safe level: restock the variant that needs it most */}
                  {urgentVariant && <AddStockLink variant={urgentVariant} variantLabel className='-ml-1.5 self-start' />}
               </SummaryCell>

               <SummaryCell label='Batches'>
                  <p className='text-xl font-semibold text-foreground tabular-nums'>
                     {summary.activeBatches.toLocaleString()}{" "}
                     <span className='text-sm font-medium text-neutral-500'>active</span>
                  </p>
                  <p className={secondaryText}>
                     {summary.archivedBatches > 0 ? `${summary.archivedBatches.toLocaleString()} archived` : "None archived"}
                  </p>
               </SummaryCell>

               {item?.has_expiry ? (
                  <SummaryCell label='Expiry'>
                     {summary.expired.length > 0 ? (
                        <>
                           <p className='text-xl font-semibold text-red-700 tabular-nums'>
                              {summary.expired.length.toLocaleString()}{" "}
                              <span className='text-sm font-medium'>expired</span>
                           </p>
                           <div className='flex items-center justify-between gap-2'>
                              <p className='text-xs text-red-700 tabular-nums'>{plural(summary.expiredUnits, "unit")} to remove</p>
                              <button
                                 type='button'
                                 onClick={onFlushExpired}
                                 className='inline-flex h-7 items-center gap-1.5 rounded-md border border-red-200 px-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700'
                              >
                                 <Trash2 className='size-3.5' aria-hidden='true' />
                                 Flush expired
                              </button>
                           </div>
                        </>
                     ) : (
                        <>
                           <p className='text-xl font-semibold text-foreground tabular-nums'>
                              {summary.expiringSoon.toLocaleString()}{" "}
                              <span className='text-sm font-medium text-neutral-500'>expiring soon</span>
                           </p>
                           <p className={cn("text-xs", summary.expiringSoon ? "text-amber-700" : "text-neutral-500")}>
                              {summary.expiringSoon ? `Within ${EXPIRY_WARNING_DAYS} days` : "Nothing expired"}
                           </p>
                        </>
                     )}
                  </SummaryCell>
               ) : (
                  <SummaryCell label='Stock levels'>
                     <p className='text-xl font-semibold text-foreground tabular-nums'>
                        {summary.reorder.toLocaleString()}{" "}
                        <span className='text-sm font-medium text-neutral-500'>reorder at</span>
                     </p>
                     <p className={cn(secondaryText, "tabular-nums")}>Max {summary.max.toLocaleString()}</p>
                  </SummaryCell>
               )}
            </div>

            {stocks.length === 0 ? (
               <div className='flex flex-col items-center gap-1 rounded-xl border border-dashed border-neutral-200 px-6 py-10 text-center'>
                  <p className='text-sm font-semibold text-foreground'>No stock received yet</p>
                  <p className='text-sm text-neutral-500'>Batches and their movements appear here once stock is added.</p>
               </div>
            ) : (
               <section className='flex flex-col gap-3'>
                  <div
                     role='radiogroup'
                     aria-label='Stock view'
                     className='grid w-full grid-cols-2 gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1 sm:w-80'
                  >
                     {[
                        { key: "batches", label: "Batches", count: stocks.length },
                        { key: "movements", label: "Movements", count: movements.length },
                     ].map((opt) => {
                        const active = view === opt.key;
                        return (
                           <button
                              key={opt.key}
                              type='button'
                              role='radio'
                              aria-checked={active}
                              onClick={() => setView(opt.key)}
                              className={cn(
                                 "flex h-8 items-center justify-center gap-1.5 rounded-md text-sm transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-primary",
                                 active
                                    ? "bg-white font-semibold text-foreground shadow-[0_1px_3px_rgb(15_23_42/0.12)]"
                                    : "font-medium text-neutral-500 hover:text-foreground",
                              )}
                           >
                              {opt.label}
                              <span className='text-xs font-medium text-neutral-500 tabular-nums'>{opt.count}</span>
                           </button>
                        );
                     })}
                  </div>

                  {view === "batches" ? (
                     <DataTable
                        key='batches'
                        columns={batchColumns}
                        searchable={false}
                        filterable={false}
                        serverSide={false}
                        tableData={stocks}
                        initialPageSize={5}
                        showPageSizeSelector={false}
                        tableHeaderClassName='hidden'
                     />
                  ) : (
                     <DataTable
                        key='movements'
                        columns={movementColumns}
                        searchable={false}
                        filterable={false}
                        serverSide={false}
                        tableData={movements}
                        initialPageSize={5}
                        showPageSizeSelector={false}
                        tableHeaderClassName='hidden'
                        emptyMessage='No movements recorded yet.'
                     />
                  )}
               </section>
            )}
         </div>
      </ScrollArea>
   );
}

import IButton from "@/components/custom/Button";
import DataTable from "@/components/custom/Datatable";
import Details from "@/components/custom/Details";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import ITooltip from "@/components/custom/Tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlushExpiredStocksMutation } from "@/features/api/inventory";
import { setSelectedStock } from "@/features/slice/inventorySlice";
import { useConfirmation } from "@/helpers/confirmAction";
import { dateParser } from "@/helpers/parser";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { cn } from "@/lib/utils";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { isPast } from "date-fns";
import { Package2, Trash2, TrendingDown, TrendingUp, TrendingUpDown, TriangleAlert } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const batchColumns = [
   {
      key: "reference_no",
      width: "50%",
      title: "Reference No.",
      render: (value, item) => {
         const isExpired = item.expires_at && isPast(item.expires_at) && !item.archived_at && Boolean(item.has_expiry);
         const isArchived = Boolean(item.archived_at);

         return (
            <ITooltip
               label={isExpired ? "Expired" : isArchived ? `Archived at ${dateParser(item.archived_at, "PPp")}` : ""}
            >
               <Paragraph
                  size='xs'
                  className={cn(
                     "font-normal text-black! flex items-center gap-1",
                     isExpired && "!text-destructive font-semibold",
                     isArchived && "line-through text-muted-foreground",
                  )}
               >
                  {value} {isExpired && <TriangleAlert className='size-4 text-destructive' />}
               </Paragraph>
            </ITooltip>
         );
      },
   },
   {
      key: "batch_quantity",
      title: "Batch Quantity",
      cellClassName: "text-xs",
   },
   {
      key: "current_quantity",
      title: "Current",
      cellClassName: "text-xs",
   },
   {
      key: "received_at",
      title: "Received At",
      cellClassName: "text-xs",
      render: (value) => dateParser(value, "PP"),
   },
];

const movementColumns = [
   {
      key: "remarks",
      width: "35%",
      title: "Remarks",
      cellClassName: "text-xs",
      render: (value) => value || "Received stocks",
   },
   {
      key: "stock_reference_no",
      title: "Batch No.",
      width: "150px",
      cellClassName: "text-xs",
   },
   {
      key: "quantity",
      title: "Qty",
      width: "80px",
      render: (value, item) => {
         const isIn = item?.type === "in";
         const isOut = item?.type === "out";
         const Icon = isIn ? TrendingUp : isOut ? TrendingDown : TrendingUpDown;
         const style = isIn
            ? "bg-emerald-50 text-emerald-700"
            : isOut
              ? "bg-red-50 text-red-600"
              : "bg-amber-50 text-amber-600";
         return (
            <span
               className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums",
                  style,
               )}
            >
               <Icon className='size-3' />
               {value}
            </span>
         );
      },
   },
   {
      key: "created_at",
      width: "200px",
      title: "Date",
      cellClassName: "text-xs",
      render: (value) => dateParser(value),
   },
];

export default function ViewStocks({ item }) {
   const dispatch = useDispatch();
   const [flushExpired] = useFlushExpiredStocksMutation();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();

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

      const payload = {
         expired_stocks: expiredStocks,
      };

      const { success, message } = await exec(flushExpired, payload);
      if (!success) return;

      dispatch(setSelectedStock(null));
      toast.success(message);
   }, [confirm, dispatch, exec, flushExpired, item?.stocks]);

   const stockLevel = useMemo(() => {
      if (item?.current_qty <= 0)
         return {
            label: "Reorder Needed",
            icon: <TriangleAlert size={24} />,
            variant: "danger",
         };

      return {
         label: "In Stock",
         icon: <Package2 size={24} />,
         variant: "default",
      };
   }, [item]);

   const lowestReorderLevel = useMemo(() => {
      if (!item?.variants || item.variants.length === 0) return item?.reorder_level || 0;
      return Math.min(...item.variants.map((v) => v.reorder_level || 0));
   }, [item]);

   const highestMaxStockLevel = useMemo(() => {
      if (!item?.variants || item.variants.length === 0) return item?.max_qty_level || 0;
      return Math.max(...item.variants.map((v) => v.max_qty_level || 0));
   }, [item]);

   return (
      <ScrollArea className='w-full flex flex-col relative max-h-130'>
         {/* Stock level banner */}
         <div
            className={cn(
               "flex items-center gap-2 rounded-xl border px-3 py-2 mb-3",
               stockLevel.variant === "danger"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700",
            )}
         >
            <span
               className={cn(
                  "size-2 rounded-full flex-shrink-0",
                  stockLevel.variant === "danger" ? "bg-red-500" : "bg-emerald-500 animate-pulse",
               )}
            />
            <span className='text-xs font-bold'>{stockLevel.label}</span>
         </div>

         {/* Stats grid */}
         <div className='grid grid-cols-3 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden mb-3'>
            {[
               { label: "Current Stocks", value: item?.current_qty || 0, valueClass: "text-primary" },
               { label: "Min Reorder Lvl", value: lowestReorderLevel, valueClass: "text-amber-600" },
               { label: "Max Stock Lvl", value: highestMaxStockLevel, valueClass: "text-blue-600" },
            ].map(({ label, value, valueClass }) => (
               <div key={label} className='bg-white px-3 py-2.5'>
                  <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5'>
                     {label}
                  </p>
                  <p className={cn("text-xl font-extrabold tabular-nums", valueClass)}>{value}</p>
               </div>
            ))}
         </div>

         {item.stocks.length > 0 && (
            <>
               <Separator className='mt-4 mb-7 outline outline-outline/40' />
               <DataTable
                  title='Stock Batches'
                  description='List of stocks received for this item.'
                  columns={batchColumns}
                  searchable={false}
                  filterable={false}
                  serverSide={false}
                  tableData={item.stocks.map((stock) => ({
                     ...stock,
                     has_expiry: item.has_expiry,
                  }))}
                  initialPageSize={5}
                  showPageSizeSelector={false}
                  tableHeaderClassName='flex items-center justify-between mb-0'
                  actionButtons={[
                     {
                        onClick: onFlushExpired,
                        className: "text-xs h-7 px-2 border-destructive text-destructive",
                        variant: "outline",
                        hidden:
                           !item.stocks.some(
                              (stock) => stock.expires_at && isPast(stock.expires_at) && !stock.archived_at,
                           ) || !item.has_expiry,
                        label: (
                           <p className='flex items-center gap-1'>
                              <Trash2 className='size-4' />
                              <span className='mt-0.5'>Flush Expired</span>
                           </p>
                        ),
                     },
                  ]}
               />

               <DataTable
                  title='Stock Movements'
                  description='List of ins and outs per batch.'
                  wrapperClassName='mt-3'
                  columns={movementColumns}
                  searchable={false}
                  filterable={false}
                  serverSide={false}
                  tableData={item.all_movements || []}
                  initialPageSize={5}
                  showPageSizeSelector={false}
                  tableHeaderClassName='flex items-center justify-between mb-0'
               />
            </>
         )}
      </ScrollArea>
   );
}

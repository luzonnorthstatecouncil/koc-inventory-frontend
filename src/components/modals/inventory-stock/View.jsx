import DataTable from "@/components/custom/Datatable";
import { dateParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { Barcode, BoxIcon, CalendarDays, Package, Truck, TrendingDown, TrendingUp, TrendingUpDown } from "lucide-react";
import { differenceInDays } from "date-fns";

const movementColumns = [
   {
      key: "remarks",
      title: "Remarks",
      width: "250px",
      render: (value) => <span className='text-xs text-muted-foreground'>{value || "Received stocks"}</span>,
   },
   {
      key: "reference_no",
      title: "Reference No.",
      render: (value) => <span className='font-mono text-xs text-foreground'>{value}</span>,
   },
   {
      key: "quantity",
      width: "90px",
      title: "Qty",
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
      width: "140px",
      title: "Date",
      render: (value) => <span className='text-xs text-muted-foreground'>{dateParser(value)}</span>,
   },
];

export default function View({ item }) {
   const expiresAt = item?.expires_at ? new Date(item.expires_at) : null;
   const daysLeft = expiresAt ? differenceInDays(expiresAt, new Date()) : null;
   const expiryStyle =
      daysLeft === null
         ? "text-muted-foreground"
         : daysLeft <= 7
           ? "text-red-600 font-semibold"
           : daysLeft <= 30
             ? "text-amber-600 font-semibold"
             : "text-emerald-700 font-semibold";

   return (
      <>
         {/* Product hero */}
         <div className='flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 mb-4'>
            <div className='p-2 bg-white rounded-lg border border-primary/10 flex-shrink-0'>
               <Package className='size-4 text-primary' />
            </div>
            <div className='min-w-0'>
               <p className='font-bold text-sm text-foreground leading-tight truncate'>
                  {item?.inventory.name} — {item?.variant?.variant_name}
               </p>
               {item?.inventory.description && (
                  <p className='text-sm text-muted-foreground mt-0.5 truncate'>{item.inventory.description}</p>
               )}
               <span className='font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded mt-1 inline-block'>
                  {item?.inventory.sku}
               </span>
            </div>
         </div>

         {/* Ref number */}
         <div className='flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 mb-4'>
            <Barcode className='size-4 text-muted-foreground flex-shrink-0' />
            <span className='font-mono text-xs font-semibold text-foreground tracking-wider'>{item?.reference_no}</span>
         </div>

         {/* Details grid */}
         <div className='grid grid-cols-2 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden mb-4'>
            {/* Batch Quantity — full width */}
            <div className='col-span-2 bg-white px-4 py-3 flex items-center justify-between gap-3'>
               <div className='flex items-center gap-2'>
                  <BoxIcon className='size-3.5 text-muted-foreground flex-shrink-0' />
                  <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                     Batch Quantity
                  </p>
               </div>
               <div className='flex items-center gap-2'>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold tabular-nums'>
                     +{item?.batch_quantity}
                  </span>
                  <span className='text-xs text-muted-foreground capitalize'>{item?.inventory.unit}</span>
               </div>
            </div>

            {/* Date Added */}
            <div className='bg-white px-4 py-3'>
               <div className='flex items-center gap-1.5 mb-1'>
                  <CalendarDays className='size-3 text-muted-foreground' />
                  <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Date Added</p>
               </div>
               <p className='text-sm font-medium text-foreground'>{dateParser(item?.received_at) ?? "—"}</p>
            </div>

            {/* Expiration Date */}
            <div className='bg-white px-4 py-3'>
               <div className='flex items-center gap-1.5 mb-1'>
                  <CalendarDays className='size-3 text-muted-foreground' />
                  <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Expiration</p>
               </div>
               {expiresAt ? (
                  <div>
                     <p className={cn("text-sm font-medium", expiryStyle)}>{dateParser(item.expires_at, "PP")}</p>
                     <p className={cn("text-sm font-semibold mt-0.5", expiryStyle)}>
                        {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}d left` : "Expired") : ""}
                     </p>
                  </div>
               ) : (
                  <p className='text-sm font-medium text-muted-foreground'>—</p>
               )}
            </div>

            {/* Supplier — full width */}
            <div className='col-span-2 bg-white px-4 py-3 flex items-center gap-3'>
               <Truck className='size-3.5 text-muted-foreground flex-shrink-0' />
               <div>
                  <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Supplier</p>
                  <p className='text-sm font-medium text-foreground'>{item?.supplier?.name ?? "—"}</p>
               </div>
            </div>
         </div>

         {/* Stock movements table */}
         <DataTable
            title='Stock Movements'
            description='List of ins and outs per batch.'
            wrapperClassName='mt-1'
            columns={movementColumns}
            searchable={false}
            filterable={false}
            serverSide={false}
            tableData={item?.movements || []}
            initialPageSize={5}
            showPageSizeSelector={false}
            tableHeaderClassName='flex items-center justify-between mb-0'
         />
      </>
   );
}

import DataTable from "@/components/custom/Datatable";
import { useGetAllStockApprovalsQuery } from "@/features/api/inventory";
import { dateParser, padwithZero } from "@/helpers/parser";
import { cn } from "@/lib/utils";

const primaryText = "text-sm font-medium text-foreground";
const secondaryText = "text-xs text-neutral-500";

/** Pending needs action (amber); approved and rejected are outcomes (green / red). */
function approvalStatus(item) {
   if (item?.rejection_reason) return { label: "Rejected", dot: "bg-red-500", text: "text-red-700" };
   if (item?.approved_at) return { label: "Approved", dot: "bg-emerald-500", text: "text-neutral-700" };
   return { label: "Pending", dot: "bg-amber-500", text: "text-amber-700" };
}

const columns = [
   {
      key: "variant.inventory.name",
      title: "Product",
      render: (value, item) => {
         const variant = item.variant?.variant_name;
         return (
            <div className='flex min-w-0 flex-col gap-0.5'>
               <span className={cn(primaryText, "truncate font-semibold")}>
                  {value}
                  {variant && variant !== "Default" && <span className='font-medium text-neutral-500'> · {variant}</span>}
               </span>
               <span className={cn(secondaryText, "truncate tabular-nums")}>
                  #{padwithZero(item.id)}
                  {item.supplier?.name && ` · ${item.supplier.name}`}
               </span>
            </div>
         );
      },
   },
   {
      key: "created_at",
      title: "Requested",
      width: "140px",
      render: (value) =>
         value ? (
            <div className='flex flex-col gap-0.5'>
               <span className={primaryText}>{dateParser(value, "PP")}</span>
               <span className={cn(secondaryText, "tabular-nums")}>{dateParser(value, "p")}</span>
            </div>
         ) : (
            <span className='text-sm text-neutral-500'>—</span>
         ),
   },
   {
      key: "approved_at",
      title: "Status",
      width: "200px",
      render: (_, item) => {
         const status = approvalStatus(item);
         // Pending shows the request's own reason; a decided one shows the rejection reason
         const note = item.status === "pending" ? item.reason : item.rejection_reason;
         return (
            <div className='flex min-w-0 flex-col gap-0.5'>
               <span className={cn("inline-flex items-center gap-2 text-sm font-medium", status.text)}>
                  <span className={cn("size-2 rounded-full", status.dot)} aria-hidden='true' />
                  {status.label}
               </span>
               {note && <span className={cn(secondaryText, "truncate")}>{note}</span>}
            </div>
         );
      },
   },
   {
      key: "quantity",
      title: "Quantity",
      width: "110px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value, item) => (
         <span className={cn(primaryText, "tabular-nums")}>
            {item.request_type === "remove" ? "−" : "+"}
            {Number(value || 0).toLocaleString()}{" "}
            <span className='text-neutral-500'>{item.variant?.inventory?.unit || "pcs"}</span>
         </span>
      ),
   },
];

export default function UserStockRequests() {
   return (
      <DataTable
         query={{
            useQuery: useGetAllStockApprovalsQuery,
            options: {
               refetchOnMountOrArgChange: true,
            },
         }}
         columns={columns}
         searchable={false}
         filterable={false}
         paginated={true}
         initialPageSize={10}
         showPageSizeSelector={false}
         emptyMessage='No stock requests yet.'
      />
   );
}

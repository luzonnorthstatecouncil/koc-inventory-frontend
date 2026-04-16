import { dateParser, priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { Barcode, CalendarDays, Info, Package, Tag } from "lucide-react";

export default function ViewDetails({ item }) {
   const isOutOfStock = item?.status === "out of stock";
   const isActive = item?.status === "active";
   const statusStyle = isOutOfStock
      ? { pill: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-500" }
      : isActive
        ? { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500 animate-pulse" }
        : { pill: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };

   return (
      <div className='w-full space-y-3'>
         {/* Product hero */}
         <div className='flex items-start gap-3 bg-gray-50 border border-primary/10 rounded-xl px-4 py-3'>
            <div className='p-2 bg-white rounded-lg border border-primary/10 flex-shrink-0 mt-0.5'>
               <Package className='size-4 text-primary' />
            </div>
            <div className='min-w-0 flex-1'>
               <p className='font-bold text-base text-foreground leading-tight'>{item?.name}</p>
               <span className='font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded mt-1 inline-block'>
                  {item?.sku}
               </span>
               {item?.serial_number && (
                  <div className='flex items-center gap-1.5 mt-1.5'>
                     <Barcode className='size-3 text-muted-foreground' />
                     <span className='font-mono text-sm text-muted-foreground'>{item.serial_number}</span>
                  </div>
               )}
            </div>
            <div className='flex flex-col items-end gap-1.5 flex-shrink-0'>
               <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize", statusStyle.pill)}>
                  <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
                  {item?.status}
               </span>
               <p className='text-base font-extrabold text-foreground tabular-nums'>{priceParser(item?.price)}</p>
               <p className='text-xs text-muted-foreground'>unit price</p>
            </div>
         </div>

         {/* Details grid */}
         <div className='grid grid-cols-2 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden'>
            {[
               { icon: Info,        label: "Description",    value: item?.description },
               { icon: Tag,         label: "Category",       value: item?.category?.name },
               { icon: CalendarDays,label: "Date Added",     value: dateParser(item?.created_at) },
               { icon: Package,     label: "Has Expiration", value: Boolean(item?.has_expiry) ? "Yes" : "No" },
            ].map(({ icon: Icon, label, value }) => (
               <div key={label} className='bg-white px-4 py-3'>
                  <div className='flex items-center gap-1.5 mb-1'>
                     <Icon className='size-3 text-muted-foreground' />
                     <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>{label}</p>
                  </div>
                  <p className='text-sm font-medium text-foreground'>{value ?? "—"}</p>
               </div>
            ))}
         </div>
      </div>
   );
}


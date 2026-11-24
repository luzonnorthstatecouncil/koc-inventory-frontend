import { dateParser, priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";

const ITEM_STATUS = {
   active: { label: "Active", dot: "bg-emerald-500", text: "text-neutral-700" },
   inactive: { label: "Inactive", dot: "bg-neutral-300", text: "text-neutral-500" },
   "out of stock": { label: "Out of stock", dot: "bg-red-500", text: "text-red-700" },
};

function Field({ label, children, className }) {
   return (
      <div className={cn("flex flex-col gap-0.5 px-4 py-3", className)}>
         <dt className='text-xs text-neutral-500'>{label}</dt>
         <dd className='text-sm font-medium text-foreground'>{children ?? "—"}</dd>
      </div>
   );
}

export default function ViewDetails({ item }) {
   const status = ITEM_STATUS[item?.status] ?? {
      label: item?.status || "—",
      dot: "bg-neutral-200",
      text: "text-neutral-500",
   };

   return (
      <div className='flex w-full flex-col gap-3'>
         <div className='flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-3.5'>
            <div className='flex min-w-0 flex-col gap-0.5'>
               <p className='truncate text-base font-semibold text-foreground'>{item?.name}</p>
               <p className='text-xs text-neutral-500 tabular-nums'>
                  {item?.sku}
                  {item?.serial_number && <span> · S/N {item.serial_number}</span>}
               </p>
               <span className={cn("mt-1.5 inline-flex items-center gap-2 text-sm font-medium", status.text)}>
                  <span className={cn("size-2 rounded-full", status.dot)} aria-hidden='true' />
                  {status.label}
               </span>
            </div>
            <div className='flex shrink-0 flex-col items-end gap-0.5'>
               <p className='text-base font-semibold text-foreground tabular-nums'>{priceParser(item?.price)}</p>
               <p className='text-xs text-neutral-500'>Unit price</p>
            </div>
         </div>

         <dl className='grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 [&>*]:bg-white'>
            <Field label='Description' className='col-span-2'>
               {item?.description}
            </Field>
            <Field label='Category'>{item?.category?.name}</Field>
            <Field label='Tracks expiry'>{item?.has_expiry ? "Yes" : "No"}</Field>
            <Field label='Date added' className='col-span-2'>
               {item?.created_at ? (
                  <span className='flex flex-col gap-0.5'>
                     <span>{dateParser(item.created_at, "PP")}</span>
                     <span className='text-xs font-medium text-neutral-500 tabular-nums'>{dateParser(item.created_at, "p")}</span>
                  </span>
               ) : null}
            </Field>
         </dl>
      </div>
   );
}

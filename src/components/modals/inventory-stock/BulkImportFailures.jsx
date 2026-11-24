import IButton from "@/components/custom/Button";
import { cn } from "@/lib/utils";
import { CircleCheck } from "lucide-react";

function Count({ label, value, tone }) {
   return (
      <div className='flex flex-col gap-0.5 bg-white px-4 py-3'>
         <p className='text-xs text-neutral-500'>{label}</p>
         <p className={cn("text-2xl font-bold tabular-nums", tone ?? "text-foreground")}>{Number(value ?? 0).toLocaleString()}</p>
      </div>
   );
}

export default function BulkImportFailures({ data, onClose }) {
   const { failed = [], summary = {} } = data ?? {};
   const failedCount = Number(summary.failed ?? 0);

   return (
      <div className='flex flex-col gap-4'>
         <div className='grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200'>
            <Count label='Total' value={summary.total} />
            <Count label='Imported' value={summary.successful} />
            <Count label='Failed' value={summary.failed} tone={failedCount > 0 ? "text-red-700" : undefined} />
         </div>

         {failed.length > 0 ? (
            <section className='flex flex-col gap-2'>
               <h3 className='text-sm font-semibold text-foreground'>
                  Failed entries <span className='font-medium text-neutral-500'>· {failed.length}</span>
               </h3>
               <ul className='max-h-72 divide-y divide-neutral-100 overflow-y-auto rounded-xl border border-neutral-200'>
                  {failed.map((item, index) => (
                     <li key={index} className='flex items-start gap-3 px-4 py-3'>
                        <span className='mt-1.5 size-2 shrink-0 rounded-full bg-red-500' aria-hidden='true' />
                        <div className='flex min-w-0 flex-col gap-0.5'>
                           <p className='flex flex-wrap items-center gap-x-1.5 text-sm font-medium text-foreground'>
                              {item.row != null && <span className='tabular-nums'>Row {item.row}</span>}
                              {item.row != null && item.sku && <span className='text-neutral-500'>·</span>}
                              {item.sku && <span className='tabular-nums'>{item.sku}</span>}
                              {item.variant_name && (
                                 <>
                                    <span className='text-neutral-500'>·</span>
                                    <span className='truncate font-medium text-neutral-500'>{item.item_name || item.variant_name}</span>
                                 </>
                              )}
                           </p>
                           <p className='text-sm text-red-700'>{item.error}</p>
                        </div>
                     </li>
                  ))}
               </ul>
            </section>
         ) : (
            <div className='flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3'>
               <CircleCheck className='size-5 shrink-0 text-emerald-600' aria-hidden='true' />
               <p className='text-sm text-foreground'>All entries were imported successfully.</p>
            </div>
         )}

         <div className='flex justify-end'>
            <IButton type='button' variant='default' onClick={onClose}>
               Close
            </IButton>
         </div>
      </div>
   );
}

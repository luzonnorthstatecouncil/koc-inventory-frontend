import ModalSkeleton from "@/components/custom/ModalSkeleton";
import { priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { AssembleKitLink } from "@/components/custom/RestockLinks";

const plural = (n, word) => `${word}${n === 1 ? "" : "s"}`;

function Fact({ label, children }) {
   return (
      <div className='flex flex-col gap-1'>
         <dt className='text-xs text-neutral-500'>{label}</dt>
         <dd className='text-sm font-medium text-foreground'>{children}</dd>
      </div>
   );
}

export default function View({ item, isLoading }) {
   if (isLoading || !item) {
      return <ModalSkeleton />;
   }

   const available = Number(item.availability) || 0;
   const locked = Number(item.locked_qty) || 0;
   const active = item.status === "active";
   // Low and out are the only states staff act on, so they're the only coloured ones.
   const availability =
      available <= 0
         ? { note: "None can be made from current stock", text: "text-red-700", dot: "bg-red-500" }
         : available <= 5
           ? { note: "Running low", text: "text-amber-700", dot: "bg-amber-500" }
           : null;

   return (
      <div className='flex flex-col gap-6 py-2'>
         <header className='flex flex-wrap items-start justify-between gap-4'>
            <div className='min-w-0'>
               <p className='text-lg font-semibold text-foreground'>{item.name}</p>
               <p className='text-sm text-neutral-500 tabular-nums'>{item.sku}</p>
            </div>
            <span
               className={cn(
                  "inline-flex items-center gap-2 text-sm font-medium capitalize",
                  active ? "text-neutral-700" : "text-neutral-500",
               )}
            >
               <span className={cn("size-2 rounded-full", active ? "bg-emerald-500" : "bg-neutral-300")} aria-hidden='true' />
               {item.status || "Inactive"}
            </span>
         </header>

         <dl className='grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-neutral-200 p-4 sm:grid-cols-4'>
            <Fact label='Price'>
               <span className='tabular-nums'>{priceParser(item.price)}</span>
            </Fact>
            <Fact label='Category'>
               {item.category?.name || <span className='font-medium text-neutral-500'>Uncategorized</span>}
            </Fact>
            <Fact label='Available'>
               <span className='tabular-nums'>
                  {available.toLocaleString()} <span className='font-medium text-neutral-500'>{plural(available, "kit")}</span>
               </span>
               {availability && (
                  <span className={cn("mt-0.5 flex items-center gap-1.5 text-xs font-medium", availability.text)}>
                     <span className={cn("size-1.5 rounded-full", availability.dot)} aria-hidden='true' />
                     {availability.note}
                  </span>
               )}
               {availability && available > 0 && <AssembleKitLink kitId={item.id} className='-ml-1.5 mt-1' />}
            </Fact>
            <Fact label='Pre-assembled'>
               <span className='tabular-nums'>{locked.toLocaleString()}</span>
               {locked > 0 && (
                  <span className='mt-0.5 block text-xs font-medium text-neutral-500 tabular-nums'>
                     + {Math.max(available - locked, 0).toLocaleString()} can be assembled
                  </span>
               )}
            </Fact>
         </dl>

         <section className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold text-foreground'>
               Components <span className='font-medium text-neutral-500'>· {item.items?.length || 0}</span>
            </h3>

            {item.items?.length ? (
               <ul className='divide-y divide-neutral-200 rounded-xl border border-neutral-200'>
                  {item.items.map((ki) => {
                     const variant = ki.variant?.name || ki.variant?.variant_name;
                     const stock = Number(ki.variant?.current_qty) || 0;
                     return (
                        <li key={ki.id} className='flex items-center justify-between gap-4 px-4 py-3'>
                           <div className='flex min-w-0 flex-col gap-0.5'>
                              <span className='truncate text-sm font-medium text-foreground'>{ki.variant?.inventory?.name}</span>
                              <span className='truncate text-xs text-neutral-500 tabular-nums'>
                                 {variant && variant !== "Default" ? variant : "Standard"} · {stock.toLocaleString()} in stock
                              </span>
                           </div>
                           <span className='shrink-0 text-sm font-medium text-foreground tabular-nums'>
                              {ki.quantity}× <span className='font-medium text-neutral-500'>per kit</span>
                           </span>
                        </li>
                     );
                  })}
               </ul>
            ) : (
               <p className='rounded-xl border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500'>
                  No components listed for this kit.
               </p>
            )}
         </section>
      </div>
   );
}

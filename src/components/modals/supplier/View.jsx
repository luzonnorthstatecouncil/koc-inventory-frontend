import { dateParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";

function Fact({ label, children }) {
   return (
      <div className='flex items-baseline justify-between gap-4'>
         <dt className='text-sm text-neutral-600'>{label}</dt>
         <dd className='truncate text-sm font-medium text-foreground tabular-nums'>{children}</dd>
      </div>
   );
}

export default function View({ supplier }) {
   if (!supplier) return null;

   // status is the string "active" / "inactive" (it used to be read as a boolean, so every supplier showed Active)
   const active = supplier.status === "active";

   return (
      <div className='flex flex-col gap-5'>
         <section className='flex flex-col gap-1'>
            <p className={cn("inline-flex items-center gap-2 text-sm font-medium", active ? "text-neutral-700" : "text-neutral-500")}>
               <span className={cn("size-2 rounded-full", active ? "bg-emerald-500" : "bg-neutral-300")} aria-hidden='true' />
               {active ? "Active" : "Inactive"}
            </p>
            <p className='text-2xl font-bold tracking-tight text-foreground'>{supplier.name}</p>
            <p className='text-sm text-neutral-500'>
               {active ? "Can be chosen when receiving stock." : "Hidden when receiving stock."}
            </p>
         </section>

         {(supplier.created_at || supplier.updated_at) && (
            <section className='flex flex-col gap-2 rounded-xl bg-neutral-50 px-4 py-3'>
               <h3 className='text-xs font-semibold text-neutral-500'>Details</h3>
               <dl className='flex flex-col gap-1.5'>
                  {supplier.created_at && (
                     <Fact label='Added'>
                        {dateParser(supplier.created_at, "PP")} · {dateParser(supplier.created_at, "p")}
                     </Fact>
                  )}
                  {supplier.updated_at && (
                     <Fact label='Last updated'>
                        {dateParser(supplier.updated_at, "PP")} · {dateParser(supplier.updated_at, "p")}
                     </Fact>
                  )}
               </dl>
            </section>
         )}
      </div>
   );
}

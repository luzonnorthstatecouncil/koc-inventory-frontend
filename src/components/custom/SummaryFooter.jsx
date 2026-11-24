import { cn } from "@/lib/utils";

const VALUE_TONE = {
   default: "text-foreground",
   warning: "text-amber-700",
   danger: "text-red-700",
};

/**
 * A report's headline totals, shown above its table so they're seen first. Each total is its own
 * card sized to its content; `tone` ("warning" | "danger") colours a value only when it needs attention.
 */
const SummaryFooter = ({ items, className }) => {
   if (!items || items.length === 0) return null;

   return (
      <dl className={cn("grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3", className)}>
         {items.map((item, index) => (
            <div key={index} className='flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-3'>
               {item.label && <dt className='text-xs text-neutral-500'>{item.label}</dt>}
               <dd className={cn("text-xl font-bold tracking-tight tabular-nums", VALUE_TONE[item.tone] ?? VALUE_TONE.default)}>
                  {item.value}
               </dd>
               {item.description && <dd className='text-xs text-neutral-500'>{item.description}</dd>}
            </div>
         ))}
      </dl>
   );
};

export default SummaryFooter;

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const NOTE_TONE = {
   default: "text-neutral-500",
   good: "text-neutral-500",
   warning: "text-amber-700",
   danger: "text-red-700",
};

const NOTE_DOT = {
   good: "bg-emerald-500",
   warning: "bg-amber-500",
   danger: "bg-red-500",
};

/**
 * A neutral summary card: title, value, subtitle, and a note that's only coloured when it needs
 * attention (`tone`: "default" | "good" | "warning" | "danger").
 */
const StatCard = ({ title, subtitle, value, note, tone = "default", icon: Icon, onClick }) => (
   <div
      className={cn("flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4", onClick && "cursor-pointer hover:border-neutral-300")}
      onClick={onClick}
   >
      <div className='flex items-center justify-between gap-2'>
         <p className='text-sm font-medium text-neutral-600'>{title}</p>
         {Icon && <Icon className='size-4 shrink-0 text-neutral-500' aria-hidden='true' />}
      </div>

      <p className='text-2xl leading-none font-bold tracking-tight text-foreground tabular-nums'>{value}</p>
      {subtitle && <p className='text-xs text-neutral-500'>{subtitle}</p>}

      {note && (
         <p className={cn("mt-auto flex items-center gap-1.5 pt-1 text-xs font-medium", NOTE_TONE[tone] ?? NOTE_TONE.default)}>
            {NOTE_DOT[tone] && <span className={cn("size-1.5 rounded-full", NOTE_DOT[tone])} aria-hidden='true' />}
            {note}
         </p>
      )}
   </div>
);

export function StatCardSkeleton() {
   return (
      <div className='flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4' aria-hidden='true'>
         <div className='flex items-center justify-between gap-2'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='size-4' />
         </div>
         <Skeleton className='h-6 w-20' />
         <Skeleton className='h-3 w-32' />
         <Skeleton className='mt-1 h-3 w-24' />
      </div>
   );
}

export default StatCard;

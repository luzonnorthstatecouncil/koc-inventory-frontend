import { cn } from "@/lib/utils";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

const StatCard = ({ title, subtitle, value, change, icon: Icon, trend, color, bgColor, priority, onClick }) => {
   const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
   const trendStyle =
      trend === "up"
         ? "text-emerald-600 bg-emerald-50"
         : trend === "down"
           ? "text-red-600 bg-red-50"
           : "text-amber-600 bg-amber-50";

   return (
      <div
         className={cn(
            "bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3 hover:shadow-md transition-all",
            onClick && "cursor-pointer",
            priority === "critical" && "border-2 border-orange-400 shadow-md",
         )}
         onClick={onClick}
      >
         <div className='flex items-start justify-between gap-2'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-snug'>{title}</p>
            <div className={cn("p-2 rounded-lg flex-shrink-0", bgColor)}>
               <Icon className={cn("size-4", color)} />
            </div>
         </div>

         <div>
            <p className='text-2xl font-extrabold text-foreground leading-none'>{value}</p>
            {subtitle && <p className='text-xs text-muted-foreground mt-1'>{subtitle}</p>}
         </div>

         {change && (
            <div className={cn("inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-xs font-semibold", trendStyle)}>
               <TrendIcon className='size-3' />
               {change}
            </div>
         )}
      </div>
   );
};

export default StatCard;


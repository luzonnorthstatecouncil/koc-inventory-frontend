import { cn } from "@/lib/utils";
import Paragraph from "./Paragraph";

export default function InfoCard({
   label,
   value,
   subtext,
   className,
   labelClassName,
   valueClassName,
   subtextClassName,
}) {
   return (
      <div className={cn("p-2 sm:p-3 bg-gray-50 rounded-md border border-outline", className)}>
         <Paragraph className={cn("mb-0.5 sm:mb-1 text-xs sm:text-sm", labelClassName)}>{label}</Paragraph>
         <Paragraph size='sm' variant='default' className={cn("sm:text-base font-semibold", valueClassName)}>
            {value}
         </Paragraph>
         {subtext && (
            <Paragraph size='xs' className={cn('sm:text-sm', subtextClassName)}>
               {subtext}
            </Paragraph>
         )}
      </div>
   );
}

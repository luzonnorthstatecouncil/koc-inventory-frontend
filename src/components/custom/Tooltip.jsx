import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ITooltip({ children, label, className, tooltipClassName, tooltipWrapperClassName, placement = "top", sideOffset = -3 }) {
   return (
      <Tooltip className={tooltipWrapperClassName}>
         <TooltipTrigger className={className}>{children}</TooltipTrigger>
         {label && (
            <TooltipContent sideOffset={sideOffset} className={tooltipClassName} side={placement}>
               <p>{label}</p>
            </TooltipContent>
         )}
      </Tooltip>
   );
}

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// asChild: use the child element as the trigger instead of wrapping it in a <button>
// (needed when the child is or contains a button, which can't be nested in another button)
export default function ITooltip({ children, label, className, tooltipClassName, tooltipWrapperClassName, placement = "top", sideOffset = -3, asChild = false }) {
   return (
      <Tooltip className={tooltipWrapperClassName}>
         <TooltipTrigger className={className} asChild={asChild}>
            {children}
         </TooltipTrigger>
         {label && (
            <TooltipContent sideOffset={sideOffset} className={tooltipClassName} side={placement}>
               <p>{label}</p>
            </TooltipContent>
         )}
      </Tooltip>
   );
}

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function IPopover({
   trigger,
   children,
   align = "center",
   sideOffset = 4,
   className,
   triggerProps = {},
   ...props
}) {
   return (
      <Popover {...props}>
         <PopoverTrigger asChild {...triggerProps}>
            {trigger}
         </PopoverTrigger>
         <PopoverContent
            align={align}
            sideOffset={sideOffset}
            className={cn("z-50", className)}
            onClick={(e) => e.stopPropagation()}
         >
            {children}
         </PopoverContent>
      </Popover>
   );
}

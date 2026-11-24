import { useSelector } from "react-redux";
import { Button } from "../ui/button";
import { Loader2Icon } from "lucide-react";
import ITooltip from "./Tooltip";

export default function IButton({ children, icon, iconPosition, tooltipOffset = -3, ...props }) {
   const isLoading = useSelector((state) => state.loading.isLoading);

   if (!props.onClick && props.type !== "submit") {
      return (
         <ITooltip label='Under Development' offset={tooltipOffset} asChild>
            <span>
               <Button {...props} disabled>
                  {children}
               </Button>
            </span>
         </ITooltip>
      );
   }

   return (
      <Button {...props} disabled={isLoading || props.disabled}>
         {isLoading ? <Loader2Icon className='animate-spin size-5' /> : children}
      </Button>
   );
}

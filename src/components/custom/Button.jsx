import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "../ui/button";
import { Loader2Icon } from "lucide-react";
import ITooltip from "./Tooltip";

/**
 * Shows its own pending state: a submit button spins while its form submits, and any button whose
 * onClick returns a promise spins until that promise settles. Pass `loading` to control it directly.
 */
export default function IButton({ children, icon, iconPosition, tooltipOffset = -3, loading, onClick, ...props }) {
   const formContext = useFormContext();
   const [pending, setPending] = useState(false);

   if (!onClick && props.type !== "submit") {
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

   const submitting = props.type === "submit" && Boolean(formContext?.formState?.isSubmitting);
   const busy = Boolean(loading) || pending || submitting;

   const handleClick = (e) => {
      const result = onClick?.(e);
      if (result && typeof result.then === "function") {
         setPending(true);
         Promise.resolve(result).finally(() => setPending(false));
      }
      return result;
   };

   return (
      <Button {...props} onClick={onClick ? handleClick : undefined} disabled={busy || props.disabled} aria-busy={busy || undefined}>
         {busy ? <Loader2Icon className='animate-spin size-5' /> : children}
      </Button>
   );
}

import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { outlineButtonVariant } from "../ui/button-variants";
import IButton from "./Button";

export default function IButtonConfirm({
   children,
   title,
   message,
   onConfirm,
   className,
   cancelLabel = "Cancel",
   confirmLabel = "Confirm",
   dialogClassName = "",
   asButton = false,
   triggerClassName,
   primaryActionVariant = "default",
   isDirty = true,
}) {
   if (!isDirty) {
      return (
         <IButton type='button' variant='outline' onClick={onConfirm}>
            Cancel
         </IButton>
      );
   }

   return (
      <AlertDialog>
         <AlertDialogTrigger className={className} onClick={(e) => e.stopPropagation()}>
            {asButton ? (
               <span className={cn(outlineButtonVariant, triggerClassName)}>{children}</span>
            ) : (
               <>{children}</>
            )}
         </AlertDialogTrigger>
         <AlertDialogContent className={`!max-w-sm p-4 ${dialogClassName}`}>
            <AlertDialogHeader>
               <AlertDialogTitle className='text-primary'>{title}</AlertDialogTitle>
               <AlertDialogDescription>{message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel className='border border-outline text-black'>{cancelLabel}</AlertDialogCancel>
               <AlertDialogAction variant={primaryActionVariant} onClick={onConfirm}>
                  {confirmLabel}
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}

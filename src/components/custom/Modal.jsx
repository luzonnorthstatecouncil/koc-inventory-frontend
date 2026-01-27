import React from "react";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import Suspense from "./Suspense";
import ModalSkeleton from "./ModalSkeleton";

const Modal = ({
   isOpen = false,
   onClose,
   title,
   description,
   children,

   size = "default",
   className,
   contentClassName,
   headerClassName,
   footerClassName,

   showFooter = true,
   primaryAction = {
      label: "Confirm",
   },
   secondaryAction = {
      label: "Cancel",
      onCancel: onClose,
   },

   closeOnOverlayClick = true,
   isLoading = false,
   loadingText = "Loading...",
}) => {
   const sizeClasses = {
      sm: "!max-w-[95vw] sm:!max-w-sm",
      default: "!max-w-[95vw] sm:!max-w-md",
      lg: "!max-w-[95vw] sm:!max-w-lg",
      xl: "!max-w-[95vw] sm:!max-w-xl",
      "2xl": "!max-w-[95vw] sm:!max-w-2xl",
      "3xl": "!max-w-[95vw] sm:!max-w-3xl",
      "4xl": "!max-w-[95vw] sm:!max-w-4xl",
      "5xl": "!max-w-[95vw] sm:!max-w-5xl",
      full: "!max-w-[95vw] sm:!max-w-full m-2 sm:m-4",
   };

   return (
      <AlertDialog open={isOpen} closeOnOverlayClick={closeOnOverlayClick} onOpenChange={onClose}>
         <AlertDialogContent className={cn("p-3 sm:p-4 md:p-6 max-h-[90vh] overflow-y-auto", sizeClasses[size], className)}>
            <AlertDialogHeader className={cn("gap-0", headerClassName)}>
               {title && <AlertDialogTitle className='text-primary text-base sm:text-lg md:text-xl'>{title}</AlertDialogTitle>}
               {description && (
                  <AlertDialogDescription>
                     {description || "Are you sure you want to proceed with this action?"}
                  </AlertDialogDescription>
               )}
            </AlertDialogHeader>

            {isOpen && (
               <Suspense fallback={<ModalSkeleton />}>
                  {isLoading ? (
                     <ModalSkeleton />
                  ) : (
                     children && <div className={cn("my-4", contentClassName)}>{children}</div>
                  )}
               </Suspense>
            )}

            {showFooter && (
               <AlertDialogFooter className={cn("flex-col sm:flex-row gap-2", footerClassName)}>
                  {secondaryAction && (
                     <AlertDialogCancel
                        onClick={secondaryAction.onCancel}
                        disabled={isLoading}
                        className='border border-outline text-black w-full sm:w-auto text-sm'
                     >
                        {secondaryAction.label || "Cancel"}
                     </AlertDialogCancel>
                  )}
                  {primaryAction && (
                     <AlertDialogAction
                        onClick={(e) => {
                           if (primaryAction.autoClose === false) e.preventDefault();
                           primaryAction.onConfirm?.();
                        }}
                        disabled={isLoading}
                        variant={primaryAction.variant ?? "default"}
                        className='w-full sm:w-auto text-sm'
                     >
                        {isLoading ? (
                           <div className='flex items-center gap-2'>
                              <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                              {loadingText}
                           </div>
                        ) : (
                           primaryAction.label || "Confirm"
                        )}
                     </AlertDialogAction>
                  )}
               </AlertDialogFooter>
            )}
         </AlertDialogContent>
      </AlertDialog>
   );
};

export default Modal;

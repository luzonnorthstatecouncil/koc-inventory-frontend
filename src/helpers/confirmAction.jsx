import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useCallback, useEffect } from "react";
import {
   openConfirmation,
   confirmAction as confirmReduxAction,
   cancelAction,
} from "@/features/slice/confirmationSlice";
import Modal from "@/components/custom/Modal";

// Store resolvers outside of Redux to avoid serialization issues
const resolvers = new Map();

// Confirmation Dialog Component - Add this to your App.jsx or main layout
export function ConfirmationDialog() {
   const dispatch = useDispatch();
   const { isOpen, dialog, dialogId } = useSelector((state) => state.confirmation);
   const isLoading = useSelector((state) => state.loading.isLoading);

   const handleConfirm = () => {
      if (dialogId && resolvers.has(dialogId)) {
         const resolver = resolvers.get(dialogId);
         resolver(true);
         resolvers.delete(dialogId);
      }
      dispatch(confirmReduxAction());
   };

   const handleCancel = () => {
      if (dialogId && resolvers.has(dialogId)) {
         const resolver = resolvers.get(dialogId);
         resolver(false);
         resolvers.delete(dialogId);
      }
      dispatch(cancelAction());
   };

   const handleOpenChange = (open) => {
      if (!open) {
         handleCancel();
      }
   };

   // Cleanup resolver on unmount or dialog change
   useEffect(() => {
      return () => {
         if (dialogId && resolvers.has(dialogId)) {
            const resolver = resolvers.get(dialogId);
            resolver(false);
            resolvers.delete(dialogId);
         }
      };
   }, [dialogId]);

   if (!dialog) return null;

   return (
      <Modal
         isOpen={isOpen}
         onClose={handleOpenChange}
         title={dialog.title || "Confirm Action"}
         headerClassName='gap-2'
         description={dialog.message || "Are you sure you want to proceed with this action?"}
         size='sm'
         primaryAction={{
            onConfirm: handleConfirm,
            variant: dialog.variant,
            label: dialog.confirmLabel || "Confirm",
         }}
      />
   );
}

// Hook to use the confirmation dialog
export function useConfirmation() {
   const dispatch = useDispatch();

   const confirm = useCallback(
      (options) => {
         return new Promise((resolve) => {
            const dialogId = Date.now() + Math.random(); // Generate unique ID
            resolvers.set(dialogId, resolve); // Store resolver outside Redux

            dispatch(
               openConfirmation({
                  dialog: options,
                  dialogId, // Only send serializable dialogId, not the resolver function
               }),
            );
         });
      },
      [dispatch],
   );

   return { confirm };
}

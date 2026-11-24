import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import Form from "@/components/custom/Form";
import IInput from "@/components/custom/Input";
import ICheckbox from "@/components/custom/Checkbox";
import { useCreateSupplierMutation, useUpdateSupplierMutation } from "@/features/api/supplier";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { supplierDefaultValues, supplierSchema } from "@/lib/zod/schema/supplier";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

/** Add a supplier, or edit one when `supplier` is passed (values prefilled). */
export default function ManageSupplier({ supplier, onClose }) {
   const isEditing = Boolean(supplier);
   const { confirm } = useConfirmation();
   const [createSupplier] = useCreateSupplierMutation();
   const [updateSupplier] = useUpdateSupplierMutation();
   const exec = useCatchQuery();

   const defaultValues = useMemo(
      () => (isEditing ? { name: supplier.name || "", status: supplier.status === "active" } : supplierDefaultValues),
      [isEditing, supplier],
   );

   const onSubmit = useCallback(
      async (data) => {
         const confirmed = await confirm(
            isEditing
               ? { title: "Save changes?", message: `Update ${supplier.name} with the changes you made?` }
               : { title: "Add this supplier?", message: `${data.name} will be available when receiving stock.` },
         );
         if (!confirmed) return;

         const payload = { ...data, status: data.status ? "active" : "inactive" };
         const { success, message } = await exec(
            isEditing ? updateSupplier : createSupplier,
            isEditing ? { ...payload, id: supplier.id } : payload,
         );
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [confirm, createSupplier, exec, isEditing, onClose, supplier, updateSupplier],
   );

   return (
      <Form
         key={isEditing ? `edit-${supplier.id}` : "create"}
         className='flex flex-col gap-4'
         onSubmit={onSubmit}
         schema={supplierSchema}
         defaultValues={defaultValues}
      >
         {(form) => (
            <>
               <IInput name='name' label='Supplier name' placeholder='Enter supplier name' />

               <div className='flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-2.5'>
                  <ICheckbox name='status' label='Active' labelClassName='text-sm font-medium' />
                  <p className='pl-6 text-xs text-neutral-500'>Active suppliers can be chosen when receiving stock.</p>
               </div>

               <footer className='-mx-3 mt-1 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                  <IButtonConfirm
                     title={isEditing ? "Discard changes?" : "Discard new supplier?"}
                     message={isEditing ? "Your changes to this supplier will be lost." : "The details you entered will be lost."}
                     cancelLabel='Keep editing'
                     confirmLabel='Discard'
                     asButton
                     onConfirm={onClose}
                     isDirty={form.formState.isDirty}
                  >
                     Cancel
                  </IButtonConfirm>
                  <IButton type='submit' variant='default'>
                     {isEditing ? "Save changes" : "Create supplier"}
                  </IButton>
               </footer>
            </>
         )}
      </Form>
   );
}

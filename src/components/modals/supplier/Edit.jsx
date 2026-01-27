import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import Form from "@/components/custom/Form";
import IInput from "@/components/custom/Input";
import ICheckbox from "@/components/custom/Checkbox";
import ITextarea from "@/components/custom/Textarea";
import { useUpdateSupplierMutation } from "@/features/api/supplier";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { supplierSchema } from "@/lib/zod/schema/supplier";
import { useCallback } from "react";
import { toast } from "sonner";

export default function Edit({ onClose, supplier }) {
   const { confirm } = useConfirmation();
   const [updateSupplier] = useUpdateSupplierMutation();
   const exec = useCatchQuery();

   const defaultValues = {
      name: supplier?.name || "",
      status: supplier?.status === "active",
   };

   const onSubmit = useCallback(
      async (data) => {
         const confirmed = await confirm({
            title: "Update Supplier",
            message: "Are you sure you want to update this supplier?",
         });

         if (!confirmed) return;

         const payload = { ...data, id: supplier.id, status: data.status ? "active" : "inactive" };
         const { success, message } = await exec(updateSupplier, payload);
         
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [confirm, updateSupplier, exec, onClose, supplier]
   );

   return (
      <Form className='flex flex-col gap-4' onSubmit={onSubmit} schema={supplierSchema} defaultValues={defaultValues}>
         {(form) => (
            <>
               <IInput name='name' label='Supplier Name' placeholder='Enter supplier name' />

               <ICheckbox name='status' label='Active Status' />

               <div className='flex items-center justify-end gap-2 mt-2'>
                  <IButtonConfirm
                     title='Cancel Update'
                     message='Are you sure you want to cancel? All unsaved changes will be lost.'
                     asButton
                     onConfirm={onClose}
                     isDirty={form.formState.isDirty}
                  >
                     Cancel
                  </IButtonConfirm>
                  <IButton type='submit' variant='default'>
                     Update Supplier
                  </IButton>
               </div>
            </>
         )}
      </Form>
   );
}

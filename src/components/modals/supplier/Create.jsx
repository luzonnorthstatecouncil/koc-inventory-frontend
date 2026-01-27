import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import Form from "@/components/custom/Form";
import IInput from "@/components/custom/Input";
import ICheckbox from "@/components/custom/Checkbox";
import ITextarea from "@/components/custom/Textarea";
import { useCreateSupplierMutation } from "@/features/api/supplier";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { supplierDefaultValues, supplierSchema } from "@/lib/zod/schema/supplier";
import { useCallback } from "react";
import { toast } from "sonner";

export default function Create({ onClose }) {
   const { confirm } = useConfirmation();
   const [createSupplier] = useCreateSupplierMutation();
   const exec = useCatchQuery();

   const onSubmit = useCallback(
      async (data) => {
         const confirmed = await confirm({
            title: "Create New Supplier",
            message: "Are you sure you want to create this supplier?",
         });

         if (!confirmed) return;

         const payload = {
            ...data,
            status: data.status ? "active" : "inactive",
         };

         const { success, message } = await exec(createSupplier, payload);
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [confirm, createSupplier, exec, onClose]
   );

   return (
      <Form
         className='flex flex-col gap-4'
         onSubmit={onSubmit}
         schema={supplierSchema}
         defaultValues={supplierDefaultValues}
      >
         {(form) => (
            <>
               <IInput name='name' label='Supplier Name' placeholder='Enter supplier name' />
               
               <ICheckbox name='status' label='Active Status' />

               <div className='flex items-center justify-end gap-2 mt-2'>
                  <IButtonConfirm
                     title='Cancel Creation'
                     message='Are you sure you want to cancel? All unsaved changes will be lost.'
                     asButton
                     onConfirm={onClose}
                     isDirty={form.formState.isDirty}
                  >
                     Cancel
                  </IButtonConfirm>
                  <IButton type='submit' variant='default'>
                     Create Supplier
                  </IButton>
               </div>
            </>
         )}
      </Form>
   );
}

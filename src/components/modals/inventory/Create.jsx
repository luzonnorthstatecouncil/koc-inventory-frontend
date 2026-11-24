import ITabs from "@/components/custom/Tabs";
import IButton from "@/components/custom/Button";
import Form from "@/components/custom/Form";
import { createItemDefaultValues, createItemSchema } from "@/lib/zod/schema/createItem";
import { useCallback } from "react";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCreateNewItemMutation } from "@/features/api/inventory";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import ItemDetails from "./CreateEdit/Details";
import ItemVariants from "./CreateEdit/Variants";

export default function Create({ onClose }) {
   const { confirm } = useConfirmation();
   const [createNewItem] = useCreateNewItemMutation();
   const exec = useCatchQuery();

   const onSubmit = useCallback(
      async (data) => {
         const confirmed = await confirm({
            title: "Submit New Item",
            message: "Are you sure you want to submit this new item?",
         });

         if (!confirmed) return;

         const payload = {
            ...data,
            variants: data.variants
               .filter(v => v.variant_name)
               .map(v => ({
                  id: crypto.randomUUID(),
                  variant_name: v.variant_name,
                  reorder_level: v.reorder_level,
                  safe_qty_level: v.safe_qty_level,
                  max_qty_level: v.max_qty_level,
               })),
         };

         const { success, message } = await exec(createNewItem, payload);
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [confirm, createNewItem, exec, onClose]
   );

   const detailKeys = ["name", "category_id", "unit"];
   const variantKeys = ["variants"];

   return (
      <Form
         className='flex flex-col gap-4'
         onSubmit={onSubmit}
         schema={createItemSchema}
         defaultValues={createItemDefaultValues}
      >
         {(form) => {
            const errors = form.formState.errors;

            const hasDetailsError = detailKeys.some((k) => !!errors[k]);
            const hasVariantsError = variantKeys.some((k) => !!errors[k]);

            const tabs = [
               { label: "Details", value: "details", hasError: hasDetailsError, content: <ItemDetails /> },
               {
                  label: "Variants",
                  value: "variants",
                  hasError: hasVariantsError,
                  content: <ItemVariants />,
               }
            ];

            return (
               <>
                  <ITabs defaultValue='details' items={tabs} />

                  <div className='flex items-center justify-end gap-2'>
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
                        Create Item
                     </IButton>
                  </div>
               </>
            );
         }}
      </Form>
   );
}

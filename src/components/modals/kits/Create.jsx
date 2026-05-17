import ITabs from "@/components/custom/Tabs";
import IButton from "@/components/custom/Button";
import Form from "@/components/custom/Form";
import { createKitDefaultValues, createKitSchema } from "@/lib/zod/schema/createKit";
import { useCallback } from "react";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCreateNewKitMutation } from "@/features/api/kit";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import KitDetails from "./CreateEdit/Details";
import KitItems from "./CreateEdit/KitItems";

export default function Create({ onClose }) {
   const { confirm } = useConfirmation();
   const [createNewKit] = useCreateNewKitMutation();
   const exec = useCatchQuery();

   const onSubmit = useCallback(
      async (data) => {
         const validItems = data.items?.filter((item) => !!item.variant_id);
         
         if (!validItems || validItems.length === 0) {
            toast.error("Please add at least one kit item");
            return;
         }

         data.items = validItems;

         const confirmed = await confirm({
            title: "Create Kit",
            message: "Are you sure you want to create this new kit?",
         });

         if (!confirmed) return;

         const { success, message } = await exec(createNewKit, data);
         if (!success) return;

         toast.success(message || "Kit created successfully");
         onClose();
      },
      [confirm, createNewKit, exec, onClose],
   );

   return (
      <Form
         className='flex flex-col gap-6'
         onSubmit={onSubmit}
         schema={createKitSchema}
         defaultValues={createKitDefaultValues}
      >
         {(form) => {
            const errors = form.formState.errors;

            const hasDetailsError = [
               "name",
               "sku",
               "price",
               "status",
               "locked_qty",
               "category_id",
            ].some((k) => !!errors[k]);
            const hasItemsError = !!errors.items;

            const tabs = [
               {
                  label: "General Info",
                  value: "details",
                  hasError: hasDetailsError,
                  content: <KitDetails />,
               },
               {
                  label: "Kit Components",
                  value: "items",
                  hasError: hasItemsError,
                  content: <KitItems />,
               },
            ];

            return (
               <>
                  <ITabs defaultValue='details' items={tabs} />

                  <div className='flex items-center justify-end gap-2 pb-4'>
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
                        Create Kit
                     </IButton>
                  </div>
               </>
            );
         }}
      </Form>
   );
}

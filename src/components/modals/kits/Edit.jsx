import ITabs from "@/components/custom/Tabs";
import IButton from "@/components/custom/Button";
import Form from "@/components/custom/Form";
import { createKitSchema } from "@/lib/zod/schema/createKit";
import { useCallback, useEffect } from "react";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import { useConfirmation } from "@/helpers/confirmAction";
import { useEditKitMutation } from "@/features/api/kit";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import KitDetails from "./CreateEdit/Details";
import KitItems from "./CreateEdit/KitItems";
import ModalSkeleton from "@/components/custom/ModalSkeleton";

export default function Edit({ item, onClose, isLoading }) {
   const { confirm } = useConfirmation();
   const [editKit] = useEditKitMutation();
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
            title: "Update Kit",
            message: "Are you sure you want to update this kit?",
         });

         if (!confirmed) return;

         const { success, message } = await exec(editKit, { ...data, id: item.id });
         if (!success) return;

         toast.success(message || "Kit updated successfully");
         onClose();
      },
      [confirm, editKit, exec, item?.id, onClose]
   );

   if (isLoading || !item) {
      return <ModalSkeleton />;
   }

   const defaultValues = {
      name: item.name || "",
      sku: item.sku || "",
      price: item.price || 0,
      category_id: item.category_id || "",
      locked_qty: item.locked_qty || 0,
      status: item.status || "active",
      items: item.items?.map(ki => ({
         variant_id: ki.variant_id,
         quantity: ki.quantity,
      })) || [{ variant_id: "", quantity: 1 }],
   };

   return (
      <Form
         className='flex flex-col gap-6'
         onSubmit={onSubmit}
         schema={createKitSchema}
         defaultValues={defaultValues}
      >
         {(form) => {
            const errors = form.formState.errors;

            const hasDetailsError = ["name", "sku", "price", "status", "locked_qty", "category_id"].some((k) => !!errors[k]);
            const hasItemsError = !!errors.items;

            const tabs = [
               { label: "General Info", value: "details", hasError: hasDetailsError, content: <KitDetails /> },
               {
                  label: "Kit Components",
                  value: "items",
                  hasError: hasItemsError,
                  content: <KitItems />,
               }
            ];

            return (
               <>
                  <ITabs defaultValue='details' items={tabs} />

                  <div className='flex items-center justify-end gap-2 pb-4'>
                     <IButtonConfirm
                        title='Cancel Changes'
                        message='Are you sure you want to cancel? All unsaved changes will be lost.'
                        asButton
                        onConfirm={onClose}
                        isDirty={form.formState.isDirty}
                     >
                        Cancel
                     </IButtonConfirm>
                     <IButton type='submit' variant='default'>
                        Save Changes
                     </IButton>
                  </div>
               </>
            );
         }}
      </Form>
   );
}

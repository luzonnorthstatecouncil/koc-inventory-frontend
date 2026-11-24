import ITabs from "@/components/custom/Tabs";
import IButton from "@/components/custom/Button";
import Form from "@/components/custom/Form";
import { useCallback } from "react";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import { useConfirmation } from "@/helpers/confirmAction";
import { useEditItemMutation } from "@/features/api/inventory";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import ItemDetails from "./CreateEdit/Details";
import ItemStocks from "./CreateEdit/Stocks";
import ItemVariants from "./CreateEdit/Variants";
import ModalSkeleton from "@/components/custom/ModalSkeleton";
import { editItemSchema, editItemVariantDefaultValues } from "@/lib/zod/schema/editItem";

export default function Edit({ item: inventoryItem, isLoading, onClose }) {
   const { confirm } = useConfirmation();
   const [editItem] = useEditItemMutation();
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
            id: inventoryItem?.id,
            variants: data.variants.filter((v) => v.variant_name),
         };

         const { success, message } = await exec(editItem, payload);
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [confirm, editItem, exec, inventoryItem?.id, onClose]
   );

   const detailKeys = ["name", "category_id", "unit"];
   const variantKeys = ["variants"];

   if (!inventoryItem || isLoading) {
      return <ModalSkeleton />;
   }

   const variantsArray = inventoryItem.variants || [];
   const variants = variantsArray.map((v) => {
      return {
         id: v.id || crypto.randomUUID(),
         variant_name: v.variant_name || v,
         reorder_level: v.reorder_level || 5,
         safe_qty_level: v.safe_qty_level || 10,
         max_qty_level: v.max_qty_level || 20,
      };
   });

   return (
      <Form
         className='flex flex-col gap-4'
         onSubmit={onSubmit}
         schema={editItemSchema}
         defaultValues={{
            sku: inventoryItem.sku || "",
            serial_number: inventoryItem.serial_number || "",
            name: inventoryItem.name || "",
            category_id: String(inventoryItem.category_id),
            status: inventoryItem.status === "active",
            unit: inventoryItem.unit || "",
            price: inventoryItem.price || 0,
            variants: variants?.length > 0 ? variants : [editItemVariantDefaultValues],
         }}
      >
         {(form) => {
            const errors = form.formState.errors;

            const hasDetailsError = detailKeys.some((k) => !!errors[k]);
            const hasVariantsError = variantKeys.some((k) => !!errors[k]);

            const tabs = [
               {
                  label: "Details",
                  value: "details",
                  hasError: hasDetailsError,
                  content: <ItemDetails currentQty={inventoryItem.current_qty} isCreate={false} />,
               },
               {
                  label: "Variants",
                  value: "variants",
                  hasError: hasVariantsError,
                  content: <ItemVariants isCreate={false} />,
               },
            ];

            return (
               <>
                  <ITabs defaultValue='details' items={tabs} />

                  <div className='flex items-center justify-end gap-2'>
                     <IButtonConfirm
                        title='Cancel Editing'
                        message='Are you sure you want to cancel? All unsaved changes will be lost.'
                        asButton
                        onConfirm={onClose}
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

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import Form from "@/components/custom/Form";
import ModalSkeleton from "@/components/custom/ModalSkeleton";
import { useCreateNewItemMutation, useEditItemMutation } from "@/features/api/inventory";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { createItemDefaultValues, createItemSchema } from "@/lib/zod/schema/createItem";
import { editItemSchema, editItemVariantDefaultValues } from "@/lib/zod/schema/editItem";
import ItemDetails from "./CreateEdit/Details";
import ItemVariants from "./CreateEdit/Variants";

/** Edit-mode form values from a saved item. */
function toEditValues(item) {
   const variants = (item.variants || []).map((v) => ({
      id: v.id || crypto.randomUUID(),
      variant_name: v.variant_name || v,
      reorder_level: v.reorder_level || 5,
      safe_qty_level: v.safe_qty_level || 10,
      max_qty_level: v.max_qty_level || 20,
   }));

   return {
      sku: item.sku || "",
      serial_number: item.serial_number || "",
      name: item.name || "",
      category_id: String(item.category_id),
      status: item.status === "active",
      unit: item.unit || "",
      price: item.price || 0,
      variants: variants.length > 0 ? variants : [{ ...editItemVariantDefaultValues, id: crypto.randomUUID() }],
   };
}

/**
 * Create a new item, or edit one when `item` is passed (`isEditing`). One form, two modes:
 * the edit values are prefilled and SKU / serial number appear; "Tracks expiry" is create-only.
 */
export default function ManageItem({ item, isEditing = false, isLoading = false, onClose }) {
   const { confirm } = useConfirmation();
   const [createNewItem] = useCreateNewItemMutation();
   const [editItem] = useEditItemMutation();
   const exec = useCatchQuery();

   const defaultValues = useMemo(
      () => (isEditing && item ? toEditValues(item) : createItemDefaultValues),
      [isEditing, item],
   );

   const onSubmit = useCallback(
      async (data) => {
         const confirmed = await confirm(
            isEditing
               ? { title: "Save changes?", message: `Update ${item?.name ?? "this item"} with the changes you made?` }
               : { title: "Create this item?", message: "Add this item and its variants to the inventory?" },
         );
         if (!confirmed) return;

         const variants = data.variants.filter((v) => v.variant_name);
         const payload = isEditing
            ? { ...data, id: item?.id, variants }
            : {
                 ...data,
                 variants: variants.map((v) => ({
                    id: crypto.randomUUID(),
                    variant_name: v.variant_name,
                    reorder_level: v.reorder_level,
                    safe_qty_level: v.safe_qty_level,
                    max_qty_level: v.max_qty_level,
                 })),
              };

         const { success, message } = await exec(isEditing ? editItem : createNewItem, payload);
         if (!success) return;

         toast.success(message);
         onClose();
      },
      [confirm, createNewItem, editItem, exec, isEditing, item?.id, item?.name, onClose],
   );

   if (isEditing && (!item || isLoading)) return <ModalSkeleton />;

   return (
      <Form
         key={isEditing ? `edit-${item?.id}` : "create"}
         className='flex flex-col gap-5'
         onSubmit={onSubmit}
         schema={isEditing ? editItemSchema : createItemSchema}
         defaultValues={defaultValues}
      >
         {(form) => (
            <>
               {/* Both halves stay on screen, so a validation error is never hidden behind a tab. */}
               <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]'>
                  <div className='flex flex-col gap-3'>
                     <div>
                        <h3 className='text-sm font-semibold text-foreground'>Details</h3>
                        <p className='text-xs text-neutral-500'>How the item appears on the Sales screen and receipts.</p>
                     </div>
                     <ItemDetails isCreate={!isEditing} currentQty={isEditing ? item?.current_qty : undefined} />
                  </div>

                  <div className='flex min-h-0 flex-col lg:border-l lg:border-neutral-200 lg:pl-6'>
                     <ItemVariants scrollClassName='lg:max-h-[min(55vh,30rem)]' />
                  </div>
               </div>

               <footer className='-mx-3 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                  <IButtonConfirm
                     title={isEditing ? "Discard changes?" : "Discard new item?"}
                     message={
                        isEditing
                           ? "Your changes to this item will be lost."
                           : "The details and variants you entered will be lost."
                     }
                     asButton
                     onConfirm={onClose}
                     isDirty={form.formState.isDirty}
                     cancelLabel='Keep editing'
                     confirmLabel='Discard'
                  >
                     Cancel
                  </IButtonConfirm>
                  <IButton type='submit' variant='default'>
                     {isEditing ? "Save changes" : "Create item"}
                  </IButton>
               </footer>
            </>
         )}
      </Form>
   );
}

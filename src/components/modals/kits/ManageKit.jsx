import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import Form from "@/components/custom/Form";
import ModalSkeleton from "@/components/custom/ModalSkeleton";
import { useCreateNewKitMutation, useEditKitMutation } from "@/features/api/kit";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { createKitDefaultValues, createKitSchema } from "@/lib/zod/schema/createKit";
import KitDetails from "./CreateEdit/Details";
import KitItems from "./CreateEdit/KitItems";

/** Edit-mode form values from a saved kit. */
function toEditValues(kit) {
   return {
      name: kit.name || "",
      sku: kit.sku || "",
      price: kit.price || 0,
      // Select options carry string values (optionParser); the API sends a number
      category_id: kit.category_id != null ? String(kit.category_id) : "",
      locked_qty: kit.locked_qty || 0,
      status: kit.status || "active",
      items: kit.items?.length
         ? kit.items.map((ki) => ({
              // String ids to match the options; `label` lets the picker show a saved item that isn't in its
              // first page of results (the schema strips it before submit)
              variant_id: String(ki.variant_id),
              quantity: ki.quantity,
              label: [ki.variant?.inventory?.name, ki.variant?.variant_name].filter(Boolean).join(" - ") || undefined,
           }))
         : [{ variant_id: "", quantity: 1 }],
   };
}

/** Create a kit, or edit one when `isEditing` with `item` (values prefilled). Same form both ways. */
export default function ManageKit({ item, isEditing = false, isLoading = false, onClose }) {
   const { confirm } = useConfirmation();
   const [createNewKit] = useCreateNewKitMutation();
   const [editKit] = useEditKitMutation();
   const exec = useCatchQuery();

   const defaultValues = useMemo(
      () => (isEditing && item ? toEditValues(item) : createKitDefaultValues),
      [isEditing, item],
   );

   const onSubmit = useCallback(
      async (data) => {
         const validItems = data.items?.filter((component) => !!component.variant_id);
         if (!validItems?.length) {
            toast.error("Add at least one component to the kit.");
            return;
         }

         const confirmed = await confirm(
            isEditing
               ? { title: "Save changes?", message: `Update ${item?.name ?? "this kit"} with the changes you made?` }
               : { title: "Create this kit?", message: "Add this kit and its components?" },
         );
         if (!confirmed) return;

         const payload = { ...data, items: validItems };
         const { success, message } = await exec(
            isEditing ? editKit : createNewKit,
            isEditing ? { ...payload, id: item.id } : payload,
         );
         if (!success) return;

         toast.success(message || (isEditing ? "Kit updated successfully" : "Kit created successfully"));
         onClose();
      },
      [confirm, createNewKit, editKit, exec, isEditing, item, onClose],
   );

   if (isEditing && (isLoading || !item)) return <ModalSkeleton />;

   return (
      <Form
         key={isEditing ? `edit-${item?.id}` : "create"}
         className='flex flex-col gap-5'
         onSubmit={onSubmit}
         schema={createKitSchema}
         defaultValues={defaultValues}
      >
         {(form) => (
            <>
               {/* Both halves stay on screen, so a validation error is never hidden behind a tab. */}
               <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]'>
                  <div className='flex flex-col gap-3'>
                     <div>
                        <h3 className='text-sm font-semibold text-foreground'>Details</h3>
                        <p className='text-xs text-neutral-500'>How the kit appears on the Sales screen and receipts.</p>
                     </div>
                     <KitDetails kitId={isEditing ? item?.id : undefined} />
                  </div>

                  <div className='flex min-h-0 flex-col lg:border-l lg:border-neutral-200 lg:pl-6'>
                     <KitItems scrollClassName='lg:max-h-[min(55vh,30rem)]' />
                  </div>
               </div>

               <footer className='-mx-3 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                  <IButtonConfirm
                     title={isEditing ? "Discard changes?" : "Discard new kit?"}
                     message={isEditing ? "Your changes to this kit will be lost." : "The details and components you entered will be lost."}
                     asButton
                     onConfirm={onClose}
                     isDirty={form.formState.isDirty}
                     cancelLabel='Keep editing'
                     confirmLabel='Discard'
                  >
                     Cancel
                  </IButtonConfirm>
                  <IButton type='submit' variant='default'>
                     {isEditing ? "Save changes" : "Create kit"}
                  </IButton>
               </footer>
            </>
         )}
      </Form>
   );
}

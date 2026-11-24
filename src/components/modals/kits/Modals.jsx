import { useGetKitByIdQuery } from "@/features/api/kit";
import Modal from "@/components/custom/Modal";
import ManageKit from "./ManageKit";
import View from "./View";

/** `modal` comes from useModalState() in the Kits page. */
export default function KitModals({ modal }) {
   const openViewModal = modal.is("view");
   const openCreateModal = modal.is("create");
   const openEditModal = modal.is("edit");
   const selectedItem = modal.item;

   const {
      data: kitItem,
      isLoading,
      isFetching,
   } = useGetKitByIdQuery(selectedItem?.id, {
      skip: !selectedItem?.id,
      refetchOnMountOrArgChange: true,
   });

   return (
      <>
         {openViewModal && (
            <Modal
               isOpen={openViewModal}
               onClose={modal.close}
               title='View Kit Details'
               size='2xl'
               description='Overview of the kit details and its components.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-2'
               primaryAction={{
                  label: "Close",
                  onConfirm: modal.close,
               }}
            >
               <View item={kitItem} isLoading={isLoading || isFetching} />
            </Modal>
         )}

         {(openCreateModal || openEditModal) && (
            <Modal
               size='5xl'
               isOpen={openCreateModal || openEditModal}
               title={openEditModal ? "Edit kit" : "Create kit"}
               description={
                  openEditModal ? "Update the kit details and its components." : "Combine items into a bundle sold as one."
               }
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <ManageKit
                  isEditing={openEditModal}
                  item={openEditModal ? kitItem : undefined}
                  isLoading={openEditModal && (isLoading || isFetching)}
                  onClose={modal.close}
               />
            </Modal>
         )}
      </>
   );
}

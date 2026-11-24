import { useGetKitByIdQuery } from "@/features/api/kit";
import Modal from "@/components/custom/Modal";
import Create from "./Create";
import Edit from "./Edit";
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

   const onViewClose = modal.close;
   const onCreateClose = modal.close;
   const onEditClose = modal.close;

   return (
      <>
         {openViewModal && (
            <Modal
               isOpen={openViewModal}
               onClose={onViewClose}
               title='View Kit Details'
               size='2xl'
               description='Overview of the kit details and its components.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-2'
               primaryAction={{
                  label: "Close",
                  onConfirm: onViewClose,
               }}
            >
               <View item={kitItem} isLoading={isLoading || isFetching} />
            </Modal>
         )}

         {openCreateModal && (
            <Modal
               size='2xl'
               isOpen={openCreateModal}
               title='Create New Kit'
               description='Combine multiple items to create a new bundle.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <Create onClose={onCreateClose} />
            </Modal>
         )}

         {openEditModal && (
            <Modal
               size='2xl'
               isOpen={openEditModal}
               title='Edit Kit'
               description='Modify kit details or update its components.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <Edit item={kitItem} onClose={onEditClose} isLoading={isLoading || isFetching} />
            </Modal>
         )}
      </>
   );
}

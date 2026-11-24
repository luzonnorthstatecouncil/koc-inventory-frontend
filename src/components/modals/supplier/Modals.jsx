import Modal from "@/components/custom/Modal";
import Create from "./Create";
import Edit from "./Edit";
import View from "./View";

/** Props: modal from useModalState() in the Suppliers page. */
export default function SupplierModals({ modal }) {
   const openViewModal = modal.is("view");
   const openCreateModal = modal.is("create");
   const openEditModal = modal.is("edit");
   const selectedSupplier = modal.item;

   const onCloseView = modal.close;
   const onCloseCreate = modal.close;
   const onCloseEdit = modal.close;

   return (
      <>
         {openViewModal && (
            <Modal title='View Supplier' isOpen={openViewModal} onClose={onCloseView} size='lg'>
               <View supplier={selectedSupplier} />
            </Modal>
         )}

         <Modal
            title='Create New Supplier'
            isOpen={openCreateModal}
            onClose={onCloseCreate}
            size='lg'
            contentClassName='my-0'
            className='gap-4 pb-0'
            secondaryAction={null}
            primaryAction={null}
         >
            <Create onClose={onCloseCreate} />
         </Modal>

         <Modal
            title='Edit Supplier'
            isOpen={openEditModal}
            onClose={onCloseEdit}
            size='lg'
            contentClassName='my-0'
            className='gap-4 pb-0'
            secondaryAction={null}
            primaryAction={null}
         >
            <Edit onClose={onCloseEdit} supplier={selectedSupplier} />
         </Modal>
      </>
   );
}

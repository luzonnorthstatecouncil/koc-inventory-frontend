import Modal from "@/components/custom/Modal";
import ManageSupplier from "./ManageSupplier";
import View from "./View";

/** Props: modal from useModalState() in the Suppliers page. */
export default function SupplierModals({ modal }) {
   const openViewModal = modal.is("view");
   const openCreateModal = modal.is("create");
   const openEditModal = modal.is("edit");
   const selectedSupplier = modal.item;

   return (
      <>
         {openViewModal && (
            <Modal
               title='Supplier'
               isOpen={openViewModal}
               onClose={modal.close}
               size='default'
               secondaryAction={null}
               primaryAction={{ label: "Close", onConfirm: modal.close }}
            >
               <View supplier={selectedSupplier} />
            </Modal>
         )}

         <Modal
            title={openEditModal ? "Edit supplier" : "Add supplier"}
            description={openEditModal ? undefined : "Suppliers are chosen when receiving stock."}
            isOpen={openCreateModal || openEditModal}
            onClose={modal.close}
            size='default'
            contentClassName='my-0'
            className='gap-4 pb-0'
            secondaryAction={null}
            primaryAction={null}
         >
            {(openCreateModal || openEditModal) && (
               <ManageSupplier supplier={openEditModal ? selectedSupplier : undefined} onClose={modal.close} />
            )}
         </Modal>
      </>
   );
}

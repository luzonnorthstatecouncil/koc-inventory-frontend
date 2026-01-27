import Modal from "@/components/custom/Modal";
import {
   setOpenCreateModal,
   setOpenEditModal,
   setOpenViewModal,
   setSelectedSupplier,
} from "@/features/slice/supplierSlice";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Create from "./Create";
import Edit from "./Edit";
import View from "./View";

export default function SupplierModals() {
   const dispatch = useDispatch();
   const { openViewModal, openCreateModal, openEditModal, selectedSupplier } = useSelector((state) => state.supplier);

   const onCloseView = useCallback(() => {
      dispatch(setOpenViewModal(false));
      dispatch(setSelectedSupplier(null));
   }, [dispatch]);

   const onCloseCreate = useCallback(() => {
      dispatch(setOpenCreateModal(false));
   }, [dispatch]);

   const onCloseEdit = useCallback(() => {
      dispatch(setOpenEditModal(false));
      dispatch(setSelectedSupplier(null));
   }, [dispatch]);

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

import { useDispatch, useSelector } from "react-redux";
import Modal from "@/components/custom/Modal";
import Create from "./Create";
import BulkCreate from "./BulkCreate";
import BulkImportFailures from "./BulkImportFailures";
import {
   setOpenCreateModal,
   setOpenEditModal,
   setOpenViewModal,
   setOpenAdjustExpiryModal,
   setOpenBulkCreateModal,
   setOpenBulkImportFailuresModal,
   setBulkImportFailures,
} from "@/features/slice/inventoryStockSlice";
import { useGetInventoryAsOptionsQuery, useGetInventoryStockByIdQuery } from "@/features/api/inventory";
import View from "./View";
import Edit from "./Edit";
import AdjustExpiry from "./AdjustExpiry";
import UserStockRequests from "./UserStockRequests";
import { setOpenUserStockRequestsModal, setSelectedUserId, setSelectedUserName } from "@/features/slice/inventorySlice";

export default function InventoryStockModals() {
   const {
      openViewModal,
      openCreateModal,
      openEditModal,
      openAdjustExpiryModal,
      openBulkCreateModal,
      openBulkImportFailuresModal,
      bulkImportFailures,
      selectedStock,
   } = useSelector((state) => state.inventoryStock);

   const { openUserStockRequestsModal, selectedUserId, selectedUserName } = useSelector((state) => state.inventory);

   const {
      data: inventoryOptions,
      isLoading: inventoryOptionsLoading,
      isFetching: inventoryOptionsFetching,
   } = useGetInventoryAsOptionsQuery(
      {},
      {
         skip: !openCreateModal,
         refetchOnMountOrArgChange: true,
      },
   );

   // const {
   //    data: inventoryStocks,
   //    isLoading: inventoryStocksLoading,
   //    isFetching: inventoryStocksFetching,
   // } = useGetInventoryStocksQuery(selectedStock?.id, {
   //    skip: !inventoryItem?.id || !openStocksModal,
   //    refetchOnMountOrArgChange: true,
   // });

   const dispatch = useDispatch();

   const onViewClose = () => {
      dispatch(setOpenViewModal(false));
   };

   const onCreateClose = () => {
      dispatch(setOpenCreateModal(false));
   };

   const onEditClose = () => {
      dispatch(setOpenEditModal(false));
   };

   const onAdjustExpiryClose = () => {
      dispatch(setOpenAdjustExpiryModal(false));
   };

   const onBulkCreateClose = () => {
      dispatch(setOpenBulkCreateModal(false));
   };

   const onBulkImportFailuresClose = () => {
      dispatch(setOpenBulkImportFailuresModal(false));
      dispatch(setBulkImportFailures(null));
   };

   const handleUserRequestsClose = () => {
      dispatch(setOpenUserStockRequestsModal(false));
      dispatch(setSelectedUserId(null));
      dispatch(setSelectedUserName(null));
   };

   return (
      <>
         {openViewModal && (
            <Modal
               isOpen={openViewModal}
               onClose={onViewClose}
               title='View Inventory Stock Batch'
               size='2xl'
               description='Overview of the inventory stock batch details.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-2'
               primaryAction={{
                  label: "Close",
                  onConfirm: onViewClose,
               }}
            >
               <View item={selectedStock} />
            </Modal>
         )}

         {openCreateModal && (
            <Modal
               size='4xl'
               isOpen={openCreateModal}
               title='Create Inventory Stock'
               description='Add a new item to the inventory.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
               isLoading={inventoryOptionsLoading || inventoryOptionsFetching}
            >
               <Create onClose={onCreateClose} inventoryOptions={inventoryOptions} />
            </Modal>
         )}

         {openEditModal && (
            <Modal
               size='lg'
               isOpen={openEditModal}
               title='Modify Inventory Stock'
               description='Modify an existing stock batch in the inventory.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <Edit onClose={onEditClose} item={selectedStock} />
            </Modal>
         )}

         {openAdjustExpiryModal && (
            <Modal
               size='lg'
               isOpen={openAdjustExpiryModal}
               title='Adjust Expiration Date'
               description='Update the expiration date for this stock batch.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <AdjustExpiry onClose={onAdjustExpiryClose} item={selectedStock} />
            </Modal>
         )}

         {openBulkCreateModal && (
            <Modal
               size='lg'
               isOpen={openBulkCreateModal}
               title='Bulk Import Stocks'
               description='Import multiple stock entries from an Excel file.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <BulkCreate onClose={onBulkCreateClose} />
            </Modal>
         )}

         {openBulkImportFailuresModal && (
            <Modal
               size='lg'
               isOpen={openBulkImportFailuresModal}
               title='Bulk Import Results'
               description='Summary of the bulk stock import, including any entries that failed to import.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <BulkImportFailures data={bulkImportFailures} onClose={onBulkImportFailuresClose} />
            </Modal>
         )}

         {openUserStockRequestsModal && (
            <Modal
               isOpen={openUserStockRequestsModal}
               onClose={handleUserRequestsClose}
               title='Stock Requests'
               description='View all stock requests made by this user'
               size='4xl'
               contentClassName='my-0'
               primaryAction={{
                  label: "Close",
                  onClose: handleUserRequestsClose,
               }}
               secondaryAction={null}
            >
               <UserStockRequests />
            </Modal>
         )}
      </>
   );
}

import { useDispatch, useSelector } from "react-redux";
import {
   setOpenBulkCreateModal,
   setOpenCreateModal,
   setOpenEditModal,
   setOpenOrdersModal,
   setOpenStocksModal,
   setOpenViewModal,
   setSelectedStock,
   setOpenBulkImportFailuresModal,
   setBulkImportFailures,
} from "@/features/slice/inventorySlice";
import { useGetInventoryByIdQuery, useGetInventoryStocksQuery } from "@/features/api/inventory";
import Modal from "@/components/custom/Modal";
import View from "./View";
import Create from "./Create";
import Edit from "./Edit";
import Stocks from "./Stocks";
import Orders from "./Orders";
import { useGetOrdersByInventoryIdQuery } from "@/features/api/order";
import BulkCreate from "./BulkCreate";
import BulkImportFailures from "../inventory-stock/BulkImportFailures";

export default function InventoryModals() {
   const {
      openViewModal,
      openCreateModal,
      openBulkCreateModal,
      openBulkImportFailuresModal,
      bulkImportFailures,
      openEditModal,
      openStocksModal,
      openOrdersModal,
      selectedItem,
   } = useSelector((state) => state.inventory);

   const {
      data: inventoryItem,
      isLoading,
      isFetching,
   } = useGetInventoryByIdQuery(selectedItem?.id, { skip: !selectedItem?.id, refetchOnMountOrArgChange: true });

   const {
      data: inventoryStocks,
      isLoading: inventoryStocksLoading,
      isFetching: inventoryStocksFetching,
   } = useGetInventoryStocksQuery(selectedItem?.id, {
      skip: !inventoryItem?.id || !openStocksModal,
      refetchOnMountOrArgChange: true,
   });

   const {
      data: inventoryOrders,
      isLoading: inventoryOrdersLoading,
      isFetching: inventoryOrdersFetching,
   } = useGetOrdersByInventoryIdQuery(selectedItem?.id, {
      skip: !selectedItem?.id || !openOrdersModal,
      refetchOnMountOrArgChange: true,
   });

   const dispatch = useDispatch();

   const onViewClose = () => {
      dispatch(setOpenViewModal(false));
      dispatch(setSelectedStock(null));
   };

   const onCreateClose = () => {
      dispatch(setOpenCreateModal(false));
   };

   const onBulkCreateClose = () => {
      dispatch(setOpenBulkCreateModal(false));
   };

   const onBulkImportFailuresClose = () => {
      dispatch(setOpenBulkImportFailuresModal(false));
      dispatch(setBulkImportFailures(null));
   };

   const onEditClose = () => {
      dispatch(setOpenEditModal(false));
   };

   const onStocksClose = () => {
      dispatch(setOpenStocksModal(false));
   };

   const onOrdersClose = () => {
      dispatch(setOpenOrdersModal(false));
   };

   return (
      <>
         {openViewModal && (
            <Modal
               isOpen={openViewModal}
               onClose={onViewClose}
               title='View Inventory Item'
               size='3xl'
               description='Overview of the inventory item details.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-2'
               primaryAction={{
                  label: "Close",
                  onConfirm: onViewClose,
               }}
            >
               <View item={inventoryItem} isLoading={isLoading || isFetching} />
            </Modal>
         )}

         {openCreateModal && (
            <Modal
               size='lg'
               isOpen={openCreateModal}
               title='Create Inventory Item'
               description='Add a new item to the inventory.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <Create onClose={onCreateClose} />
            </Modal>
         )}

         {openBulkCreateModal && (
            <Modal
               size='lg'
               isOpen={openBulkCreateModal}
               title='Bulk Import Items'
               description='Import multiple inventory items from an Excel file.'
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
               description='Summary of the bulk item import, including any entries that failed to import.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <BulkImportFailures data={bulkImportFailures} onClose={onBulkImportFailuresClose} />
            </Modal>
         )}

         {openEditModal && (
            <Modal
               size='2xl'
               isOpen={openEditModal}
               title='Edit Inventory Item'
               description='Modify the details of the inventory item.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <Edit item={inventoryItem} onClose={onEditClose} isLoading={isLoading || isFetching} />
            </Modal>
         )}

         {openStocksModal && (
            <Modal
               size='2xl'
               isOpen={openStocksModal}
               title='Manage Inventory Stocks'
               description='Add or remove the stocks of inventory item.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-4 pb-0'
               primaryAction={null}
            >
               <Stocks
                  item={inventoryItem}
                  inventoryStocks={inventoryStocks}
                  onClose={onStocksClose}
                  isLoading={isLoading || isFetching || inventoryStocksLoading || inventoryStocksFetching}
               />
            </Modal>
         )}

         {openOrdersModal && (
            <Modal
               isOpen={openOrdersModal}
               onClose={onOrdersClose}
               title={`View Orders for ${inventoryItem?.sku || "this item"}`}
               size='xl'
               description='Overview of all the orders for this inventory item.'
               secondaryAction={null}
               contentClassName='my-0'
               className='gap-2'
               primaryAction={{
                  label: "Close",
                  onConfirm: onOrdersClose,
               }}
            >
               <Orders item={inventoryOrders} isLoading={inventoryOrdersLoading || inventoryOrdersFetching} />
            </Modal>
         )}
      </>
   );
}

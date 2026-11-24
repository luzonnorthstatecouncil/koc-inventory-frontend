import { clearStates, setState } from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   openViewModal: false,
   openCreateModal: false,
   openBulkCreateModal: false,
   openBulkImportFailuresModal: false,
   bulkImportFailures: null,
   openEditModal: false,
   openStocksModal: false,
   openOrdersModal: false,
   openRejectStockModal: false,
   openViewStockModal: false,
   openUserStockRequestsModal: false,

   selectedItem: null,
   selectedStock: null,
   selectedStockApproval: null,
   selectedUserId: null,
   selectedUserName: null,
};

const inventorySlice = createSlice({
   name: "inventory",
   initialState,
   reducers: {
      setOpenViewModal: setState("openViewModal"),
      setOpenCreateModal: setState("openCreateModal"),
      setOpenBulkCreateModal: setState("openBulkCreateModal"),
      setOpenBulkImportFailuresModal: setState("openBulkImportFailuresModal"),
      setBulkImportFailures: setState("bulkImportFailures"),
      setOpenEditModal: setState("openEditModal"),
      setOpenStocksModal: setState("openStocksModal"),
      setOpenOrdersModal: setState("openOrdersModal"),
      setOpenRejectStockModal: setState("openRejectStockModal"),
      setOpenViewStockModal: setState("openViewStockModal"),
      setOpenUserStockRequestsModal: setState("openUserStockRequestsModal"),

      setSelectedItem: setState("selectedItem"),
      setSelectedStock: setState("selectedStock"),
      setSelectedStockApproval: setState("selectedStockApproval"),
      setSelectedUserId: setState("selectedUserId"),
      setSelectedUserName: setState("selectedUserName"),

      resetInventory: clearStates(initialState),
   },
});

export const {
   setOpenViewModal,
   setOpenCreateModal,
   setOpenBulkCreateModal,
   setOpenBulkImportFailuresModal,
   setBulkImportFailures,
   setOpenEditModal,
   setOpenStocksModal,
   setOpenOrdersModal,
   setOpenRejectStockModal,
   setOpenViewStockModal,
   setOpenUserStockRequestsModal,

   setSelectedItem,
   setSelectedStock,
   setSelectedStockApproval,
   setSelectedUserId,
   setSelectedUserName,

   resetInventory,
} = inventorySlice.actions;
export default inventorySlice.reducer;

import {
   appendArray,
   clearArray,
   clearState,
   clearStates,
   removeArray,
   setState,
   updateArray,
} from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   openViewModal: false,
   openCreateModal: false,
   openBulkCreateModal: false,
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

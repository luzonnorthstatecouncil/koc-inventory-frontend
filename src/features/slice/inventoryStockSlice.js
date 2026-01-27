import { clearStates, setState } from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   openViewModal: false,
   openCreateModal: false,
   openEditModal: false,
   openStocksModal: false,
   openAdjustExpiryModal: false,
   selectedItem: null,
   selectedStock: null,
};

const inventoryStockSlice = createSlice({
   name: "inventoryStock",
   initialState,
   reducers: {
      setOpenViewModal: setState("openViewModal"),
      setOpenCreateModal: setState("openCreateModal"),
      setOpenEditModal: setState("openEditModal"),
      setOpenStocksModal: setState("openStocksModal"),
      setOpenAdjustExpiryModal: setState("openAdjustExpiryModal"),

      setSelectedItem: setState("selectedItem"),
      setSelectedStock: setState("selectedStock"),

      resetInventory: clearStates(initialState),
   },
});

export const {
   setOpenViewModal,
   setOpenCreateModal,
   setOpenEditModal,
   setOpenStocksModal,
   setOpenAdjustExpiryModal,

   setSelectedItem,
   setSelectedStock,

   resetInventory,
} = inventoryStockSlice.actions;
export default inventoryStockSlice.reducer;

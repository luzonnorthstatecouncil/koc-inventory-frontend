import {
   clearStates,
   setState,
} from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   openViewModal: false,
   openCreateModal: false,
   openEditModal: false,

   selectedSupplier: null,
};

const supplierSlice = createSlice({
   name: "supplier",
   initialState,
   reducers: {
      setOpenViewModal: setState("openViewModal"),
      setOpenCreateModal: setState("openCreateModal"),
      setOpenEditModal: setState("openEditModal"),

      setSelectedSupplier: setState("selectedSupplier"),

      resetSupplier: clearStates(initialState),
   },
});

export const {
   setOpenViewModal,
   setOpenCreateModal,
   setOpenEditModal,

   setSelectedSupplier,

   resetSupplier,
} = supplierSlice.actions;

export default supplierSlice.reducer;

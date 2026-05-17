import {
   setState,
   clearStates,
} from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   openViewModal: false,
   openCreateModal: false,
   openEditModal: false,

   selectedItem: null,
};

const kitSlice = createSlice({
   name: "kit",
   initialState,
   reducers: {
      setOpenViewModal: setState("openViewModal"),
      setOpenCreateModal: setState("openCreateModal"),
      setOpenEditModal: setState("openEditModal"),

      setSelectedItem: setState("selectedItem"),

      resetKit: clearStates(initialState),
   },
});

export const {
   setOpenViewModal,
   setOpenCreateModal,
   setOpenEditModal,

   setSelectedItem,

   resetKit,
} = kitSlice.actions;

export default kitSlice.reducer;

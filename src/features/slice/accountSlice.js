import { setState } from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   editableSections: {
      personalInfo: false,
      accountDetails: false,
   },
};

const orderSlice = createSlice({
   name: "inventory",
   initialState,
   reducers: {
      setEditableSection: setState("editableSections"),
   },
});

export const { setEditableSection } = orderSlice.actions;
export default orderSlice.reducer;

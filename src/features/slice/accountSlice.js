import { setState } from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   editableSections: {
      personalInfo: false,
      accountDetails: false,
   },
};

const accountSlice = createSlice({
   name: "account",
   initialState,
   reducers: {
      setEditableSection: setState("editableSections"),
   },
});

export const { setEditableSection } = accountSlice.actions;
export default accountSlice.reducer;

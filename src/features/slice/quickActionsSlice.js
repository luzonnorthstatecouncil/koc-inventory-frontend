import { createSlice } from "@reduxjs/toolkit";

/**
 * Shortcuts that open from anywhere a shortage is shown:
 * - addStock: { variantId, quantity, supplierId } prefills the Add stock popup
 * - assembleKit: { kitId } opens "Assemble more" for a kit
 */
const initialState = {
   addStock: null,
   assembleKit: null,
};

const quickActionsSlice = createSlice({
   name: "quickActions",
   initialState,
   reducers: {
      openAddStock: (state, action) => {
         state.addStock = action.payload ?? {};
      },
      closeAddStock: (state) => {
         state.addStock = null;
      },
      openAssembleKit: (state, action) => {
         state.assembleKit = action.payload;
      },
      closeAssembleKit: (state) => {
         state.assembleKit = null;
      },
   },
});

export const { openAddStock, closeAddStock, openAssembleKit, closeAssembleKit } = quickActionsSlice.actions;
export default quickActionsSlice.reducer;

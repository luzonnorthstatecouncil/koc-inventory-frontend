import { appendArray, clearArray, clearStates, setState } from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   cart: [],
   // Cash is the only enabled method, so it's selected from the start.
   paymentMethod: "cash",
   searchQuery: "",
   category: null,
   showLowStock: false,
   amountTendered: "",
   invoiceNumber: "",
   isDeduction: false,
   remarks: "Internal Use",
};

/**
 * A kit and a variant can share the same numeric id, so cart lines are
 * identified by id + isKit together.
 */
export const isSameCartLine = (a, b) => a.id === b.id && Boolean(a.isKit) === Boolean(b.isKit);

const cartSlice = createSlice({
   name: "cart",
   initialState,
   reducers: {
      addCart: appendArray("cart"),
      // payload: { id, isKit, data }
      updateCart: (state, action) => {
         state.cart = state.cart.map((item) => (isSameCartLine(item, action.payload) ? action.payload.data : item));
      },
      // payload: { id, isKit }
      removeFromCart: (state, action) => {
         state.cart = state.cart.filter((item) => !isSameCartLine(item, action.payload));
      },
      clearCart: clearArray("cart"),
      setPaymentMethod: setState("paymentMethod"),
      setSearchQuery: setState("searchQuery"),
      setCategory: setState("category"),
      setShowLowStock: setState("showLowStock"),
      setAmountTendered: setState("amountTendered"),
      setInvoiceNumber: setState("invoiceNumber"),
      setIsDeduction: setState("isDeduction"),
      setRemarks: setState("remarks"),
      setCart: setState("cart"),
      resetCheckout: clearStates(initialState),
   },
});

export const {
   addCart,
   updateCart,
   removeFromCart,
   clearCart,
   setPaymentMethod,
   setSearchQuery,
   setCategory,
   setShowLowStock,
   setAmountTendered,
   setInvoiceNumber,
   setIsDeduction,
   setRemarks,
   setCart,
   resetCheckout,
} = cartSlice.actions;
export default cartSlice.reducer;

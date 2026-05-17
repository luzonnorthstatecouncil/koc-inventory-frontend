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
import { set } from "date-fns";

const initialState = {
   cart: [],
   paymentMethod: null,
   searchQuery: "",
   category: null,
   showLowStock: false,
   showProcessPayment: false,
   showInvoiceNumberModal: false,
   amountTendered: 0,
   invoiceNumber: "",
   isDeduction: false,
   remarks: "Internal Use",
};

const cartSlice = createSlice({
   name: "user",
   initialState,
   reducers: {
      addCart: appendArray("cart"),
      updateCart: updateArray("cart"),
      removeFromCart: removeArray("cart"),
      clearCart: clearArray("cart"),
      setPaymentMethod: setState("paymentMethod"),
      setSearchQuery: setState("searchQuery"),
      setCategory: setState("category"),
      setShowLowStock: setState("showLowStock"),
      setShowProcessPayment: setState("showProcessPayment"),
      setShowInvoiceNumberModal: setState("showInvoiceNumberModal"),
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
   setShowProcessPayment,
   setShowInvoiceNumberModal,
   setAmountTendered,
   setInvoiceNumber,
   setIsDeduction,
   setRemarks,
   setCart,
   resetCheckout,
} = cartSlice.actions;
export default cartSlice.reducer;

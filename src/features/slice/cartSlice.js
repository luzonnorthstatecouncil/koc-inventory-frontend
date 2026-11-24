import { appendArray, clearArray, clearStates, setState } from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

/**
 * Random key sent with each checkout. A retry of the same sale (e.g. after a timeout) reuses
 * it, so the server returns the sale it already recorded instead of charging twice. Any cart
 * change makes it a different sale, so the key rotates.
 */
const newClientRef = () =>
   globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

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
   clientRef: newClientRef(),
};

/** Wraps a reducer that changes the cart so the checkout key rotates with it. */
const changesCart = (reducer) => ({
   reducer: (state, action) => {
      reducer(state, action);
      state.clientRef = action.meta.clientRef;
   },
   prepare: (payload) => ({ payload, meta: { clientRef: newClientRef() } }),
});

/**
 * A kit and a variant can share the same numeric id, so cart lines are
 * identified by id + isKit together.
 */
export const isSameCartLine = (a, b) => a.id === b.id && Boolean(a.isKit) === Boolean(b.isKit);

const cartSlice = createSlice({
   name: "cart",
   initialState,
   reducers: {
      addCart: changesCart(appendArray("cart")),
      // payload: { id, isKit, data }
      updateCart: changesCart((state, action) => {
         state.cart = state.cart.map((item) => (isSameCartLine(item, action.payload) ? action.payload.data : item));
      }),
      // payload: { id, isKit }
      removeFromCart: changesCart((state, action) => {
         state.cart = state.cart.filter((item) => !isSameCartLine(item, action.payload));
      }),
      clearCart: changesCart(clearArray("cart")),
      setPaymentMethod: setState("paymentMethod"),
      setSearchQuery: setState("searchQuery"),
      setCategory: setState("category"),
      setShowLowStock: setState("showLowStock"),
      setAmountTendered: setState("amountTendered"),
      setInvoiceNumber: setState("invoiceNumber"),
      setIsDeduction: setState("isDeduction"),
      setRemarks: setState("remarks"),
      setCart: changesCart(setState("cart")),
      resetCheckout: changesCart(clearStates(initialState)),
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

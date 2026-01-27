import { setState } from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   openViewModal: false,
   openRefundModal: false,
   selectedOrder: null,
};

const orderSlice = createSlice({
   name: "inventory",
   initialState,
   reducers: {
      setOpenViewModal: setState("openViewModal"),
      setOpenRefundModal: setState("openRefundModal"),
      setSelectedOrder: setState("selectedOrder"),
   },
});

export const { setOpenViewModal, setOpenRefundModal, setOrderRefundReason, setOrderRefundDetails, setSelectedOrder } =
   orderSlice.actions;
export default orderSlice.reducer;

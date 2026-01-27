import { setState } from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   enableBarcodeScanner: false,
   barcodeActive: true,
   barcodeValue: "",
};

const barcodeSlice = createSlice({
   name: "barcode",
   initialState,
   reducers: {
      setEnableBarcodeScanner: setState("enableBarcodeScanner"),
      setBarcodeActive: setState("barcodeActive"),
      setBarcodeValue: setState("barcodeValue"),
   },
});

export const { setEnableBarcodeScanner, setBarcodeActive, setBarcodeValue } = barcodeSlice.actions;
export default barcodeSlice.reducer;

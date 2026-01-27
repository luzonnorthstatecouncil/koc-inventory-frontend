import userSlice from "@/features/slice/userSlice";
import loadingReducer from "@/features/slice/loading";
import cartSlice from "@/features/slice/cartSlice";
import inventorySlice from "@/features/slice/inventorySlice";
import inventoryStockSlice from "@/features/slice/inventoryStockSlice";
import confirmationReducer from "@/features/slice/confirmationSlice";
import orderSlice from "@/features/slice/orderSlice";
import barcodeSlice from "@/features/slice/barcodeSlice";
import supplierSlice from "@/features/slice/supplierSlice";
import accountSlice from "@/features/slice/accountSlice";
import { configureStore } from "@reduxjs/toolkit";
import { inventoryApi } from "@/features/api/inventory";
import { authApi } from "@/features/api/auth";
import { userApi } from "@/features/api/users";
import { categoryApi } from "@/features/api/category";
import { activityLogApi } from "@/features/api/activityLog";
import { orderApi } from "@/features/api/order";
import { supplierApi } from "@/features/api/supplier";

export const store = configureStore({
   reducer: {
      user: userSlice,
      cart: cartSlice,
      loading: loadingReducer,
      confirmation: confirmationReducer,
      inventory: inventorySlice,
      inventoryStock: inventoryStockSlice,
      order: orderSlice,
      barcode: barcodeSlice,
      supplier: supplierSlice,
      account: accountSlice,
      [userApi.reducerPath]: userApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
      [inventoryApi.reducerPath]: inventoryApi.reducer,
      [categoryApi.reducerPath]: categoryApi.reducer,
      [activityLogApi.reducerPath]: activityLogApi.reducer,
      [orderApi.reducerPath]: orderApi.reducer,
      [supplierApi.reducerPath]: supplierApi.reducer,
   },
   middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
         inventoryApi.middleware,
         authApi.middleware,
         userApi.middleware,
         categoryApi.middleware,
         activityLogApi.middleware,
         orderApi.middleware,
         supplierApi.middleware
      ),
});

import userSlice from "@/features/slice/userSlice";
import loadingReducer from "@/features/slice/loading";
import cartSlice from "@/features/slice/cartSlice";
import inventorySlice from "@/features/slice/inventorySlice";
import inventoryStockSlice from "@/features/slice/inventoryStockSlice";
import confirmationReducer from "@/features/slice/confirmationSlice";
import accountSlice from "@/features/slice/accountSlice";

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "@/features/api/baseApi";

// Feature APIs register their endpoints on baseApi when imported
import "@/features/api/auth";
import "@/features/api/users";
import "@/features/api/inventory";
import "@/features/api/category";
import "@/features/api/activityLog";
import "@/features/api/order";
import "@/features/api/supplier";
import "@/features/api/kit";

export const store = configureStore({
   reducer: {
      user: userSlice,
      cart: cartSlice,
      loading: loadingReducer,
      confirmation: confirmationReducer,
      inventory: inventorySlice,
      inventoryStock: inventoryStockSlice,
      account: accountSlice,
      [baseApi.reducerPath]: baseApi.reducer,
   },
   middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

// Lets queries opt into refetchOnFocus (Sales keeps stock current when staff come back to the tab).
setupListeners(store.dispatch);

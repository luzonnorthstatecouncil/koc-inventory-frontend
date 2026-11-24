import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/utils";
import {
   ACTIVITY_LOG_TAGS,
   APPROVAL_TAGS,
   CATEGORY_TAGS,
   INVENTORY_TAGS,
   KIT_TAGS,
   ORDER_TAGS,
   SHIFT_TAGS,
   STOCKS_TAGS,
   SUPPLIER_TAGS,
   USER_TAGS,
} from "@/constants/redux-tags";

const tagValues = (tags) => (typeof tags === "string" ? [tags] : Object.values(tags));

/**
 * The single RTK Query API. Feature files (inventory.js, order.js, ...) add their endpoints with
 * `baseApi.injectEndpoints`, so every cache lives in one place: a mutation in one feature can
 * invalidate another feature's data (e.g. a sale refreshes stock lists), and logout can clear
 * everything with `baseApi.util.resetApiState()`.
 */
export const baseApi = createApi({
   reducerPath: "api",
   baseQuery,
   tagTypes: [
      ACTIVITY_LOG_TAGS,
      APPROVAL_TAGS,
      CATEGORY_TAGS,
      INVENTORY_TAGS,
      KIT_TAGS,
      ORDER_TAGS,
      SHIFT_TAGS,
      STOCKS_TAGS,
      SUPPLIER_TAGS,
      USER_TAGS,
   ].flatMap(tagValues),
   endpoints: () => ({}),
});

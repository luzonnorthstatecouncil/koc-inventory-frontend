import { ORDER_TAGS } from "@/constants/redux-tags";
import { urlParams } from "@/helpers/urlParams";
import { baseQuery } from "@/lib/utils";
import { createApi } from "@reduxjs/toolkit/query/react";

export const orderApi = createApi({
   reducerPath: "orderApi",
   baseQuery: baseQuery,
   endpoints: (builder) => ({
      getAllOrders: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/orders?${queryParams}`;
         },
         providesTags: [ORDER_TAGS],
      }),
      getOrdersByInventoryId: builder.query({
         query: (inventoryId) => `/v1/orders/inventory/${inventoryId}`,
         providesTags: [ORDER_TAGS],
      }),
      getOrderStatistics: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/orders/stats?${queryParams}`;
         },
         providesTags: [ORDER_TAGS],
      }),
      checkoutOrder: builder.mutation({
         query: (data) => ({
            url: "/v1/orders/",
            method: "POST",
            body: data,
         }),
         invalidatesTags: [ORDER_TAGS],
      }),
      refundOrder: builder.mutation({
         query: ({ id: orderId, reason }) => ({
            url: `/v1/orders/${orderId}/refund/`,
            method: "POST",
            body: { reason },
         }),
         invalidatesTags: [ORDER_TAGS],
      }),
      voidRefundOrder: builder.mutation({
         query: (refundId) => ({
            url: `/v1/orders/${refundId}/void-refund/`,
            method: "POST",
         }),
         invalidatesTags: [ORDER_TAGS],
      }),
   }),
});

export const {
   useGetAllOrdersQuery,
   useGetOrdersByInventoryIdQuery,
   useGetOrderStatisticsQuery,
   useCheckoutOrderMutation,
   useRefundOrderMutation,
   useVoidRefundOrderMutation,
} = orderApi;

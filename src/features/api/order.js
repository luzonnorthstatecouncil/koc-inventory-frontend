import { STOCK_CHANGE_TAGS } from "@/constants/redux-tags";
import { ORDER_TAGS } from "@/constants/redux-tags";
import { urlParams } from "@/helpers/urlParams";
import { baseApi } from "./baseApi";

export const orderApi = baseApi.injectEndpoints({
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
         invalidatesTags: [...new Set([ORDER_TAGS, ...STOCK_CHANGE_TAGS])],
      }),
      refundOrder: builder.mutation({
         query: ({ id: orderId, reason, reason_details }) => ({
            url: `/v1/orders/${orderId}/refund`,
            method: "POST",
            // The details typed for "Other" used to be dropped; store them with the reason
            body: { reason: reason_details?.trim() ? `${reason}: ${reason_details.trim()}` : reason },
         }),
         invalidatesTags: [...new Set([ORDER_TAGS, ...STOCK_CHANGE_TAGS])],
      }),
      voidRefundOrder: builder.mutation({
         query: (refundId) => ({
            url: `/v1/orders/${refundId}/void-refund`,
            method: "POST",
         }),
         invalidatesTags: [...new Set([ORDER_TAGS, ...STOCK_CHANGE_TAGS])],
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

import { STOCK_CHANGE_TAGS } from "@/constants/redux-tags";
import { ORDER_TAGS, SHIFT_TAGS } from "@/constants/redux-tags";
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
         invalidatesTags: [...new Set([ORDER_TAGS, SHIFT_TAGS, ...STOCK_CHANGE_TAGS])],
      }),
      refundOrder: builder.mutation({
         // items: [{ order_item_id, quantity }] for a partial refund; omit to refund everything left
         query: ({ id: orderId, reason, reason_details, items }) => ({
            url: `/v1/orders/${orderId}/refund`,
            method: "POST",
            // The details typed for "Other" used to be dropped; store them with the reason
            body: { reason: reason_details?.trim() ? `${reason}: ${reason_details.trim()}` : reason, items },
         }),
         invalidatesTags: [...new Set([ORDER_TAGS, SHIFT_TAGS, ...STOCK_CHANGE_TAGS])],
      }),
      // Cancel a sale outright (manager, while its shift is open)
      voidOrder: builder.mutation({
         query: ({ id, reason }) => ({
            url: `/v1/orders/${id}/void`,
            method: "POST",
            body: { reason },
         }),
         invalidatesTags: [...new Set([ORDER_TAGS, SHIFT_TAGS, ...STOCK_CHANGE_TAGS])],
      }),
      // Sales report for a date range: { range, summary, by_day, by_cashier, by_item, by_category }
      getSalesReport: builder.query({
         query: (params) => `/v1/reports/sales?${urlParams(params)}`,
         providesTags: [ORDER_TAGS],
      }),
      voidRefundOrder: builder.mutation({
         query: (refundId) => ({
            url: `/v1/orders/${refundId}/void-refund`,
            method: "POST",
         }),
         invalidatesTags: [...new Set([ORDER_TAGS, SHIFT_TAGS, ...STOCK_CHANGE_TAGS])],
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
   useVoidOrderMutation,
   useGetSalesReportQuery,
} = orderApi;

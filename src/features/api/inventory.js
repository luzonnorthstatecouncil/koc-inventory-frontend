import { APPROVAL_TAGS, INVENTORY_TAGS, STOCKS_TAGS } from "@/constants/redux-tags";
import { baseQuery } from "@/lib/utils";
import { createApi } from "@reduxjs/toolkit/query/react";
import { tableUrlParams, urlParams } from "@/helpers/urlParams";
import { get } from "react-hook-form";

export const inventoryApi = createApi({
   reducerPath: "inventoryApi",
   baseQuery: baseQuery,
   endpoints: (builder) => ({
      getInventoryList: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/inventory?${queryParams}`;
         },
         providesTags: [INVENTORY_TAGS.LIST],
      }),
      getInventoryById: builder.query({
         query: (id) => `/v1/inventory/${id}`,
         providesTags: [INVENTORY_TAGS.DETAIL],
      }),
      getInventoryAsOptions: builder.query({
         query: () => "/v1/inventory/as-options",
         providesTags: [INVENTORY_TAGS.LIST],
      }),
      getInventoryAsOptionsPaginated: builder.query({
         query: (params) => {
            const queryParams = tableUrlParams(params);
            return `/v1/inventory/as-options-paginated?${queryParams}`;
         },
         providesTags: [INVENTORY_TAGS.LIST],
      }),
      getInventoryListWithStock: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/inventory/with-stocks?${queryParams}`;
         },
         providesTags: [INVENTORY_TAGS.LIST],
      }),
      getReorderReport: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/reports/reorder?${queryParams}`;
         },
         providesTags: [INVENTORY_TAGS.LIST],
      }),
      getVelocityReport: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/reports/velocity?${queryParams}`;
         },
         providesTags: [INVENTORY_TAGS.LIST],
      }),
      getReportDashboardStatus: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/reports/dashboard-status?${queryParams}`;
         },
         providesTags: [INVENTORY_TAGS.LIST],
      }),
      getInventoryStatusReport: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/reports/inventory-status?${queryParams}`;
         },
         providesTags: [INVENTORY_TAGS.LIST],
      }),
      createNewItem: builder.mutation({
         query: (data) => ({
            url: `/v1/inventory`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: [INVENTORY_TAGS.LIST],
      }),
      bulkCreateItems: builder.mutation({
         query: (data) => ({
            url: `/v1/inventory/bulk-import`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: [INVENTORY_TAGS.LIST],
      }),
      editItem: builder.mutation({
         query: (data) => ({
            url: `/v1/inventory/${data.id}`,
            method: "PUT",
            body: data,
         }),
         invalidatesTags: [INVENTORY_TAGS.DETAIL, INVENTORY_TAGS.LIST],
      }),
      deleteItem: builder.mutation({
         query: (data) => ({
            url: `/v1/inventory/${data.id}`,
            method: "DELETE",
         }),
         invalidatesTags: [INVENTORY_TAGS.LIST],
      }),

      // Stocks
      getInventoryStockList: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/stocks?${queryParams}`;
         },
         providesTags: [STOCKS_TAGS.LIST],
      }),
      getInventoryStocks: builder.query({
         query: (id) => `/v1/stocks/inventory/${id}`,
         providesTags: [INVENTORY_TAGS.DETAIL, STOCKS_TAGS.DETAIL],
      }),
      getInventoryStockById: builder.query({
         query: (id) => `/v1/stocks/${id}`,
         providesTags: [STOCKS_TAGS.DETAIL],
      }),
      createStock: builder.mutation({
         query: (data) => ({
            url: "/v1/stocks",
            method: "POST",
            body: data,
         }),
         invalidatesTags: [INVENTORY_TAGS.DETAIL, STOCKS_TAGS.LIST],
      }),
      bulkCreateStocks: builder.mutation({
         query: (data) => ({
            url: "/v1/stocks/bulk-import",
            method: "POST",
            body: data,
         }),
         invalidatesTags: [INVENTORY_TAGS.DETAIL, INVENTORY_TAGS.LIST, STOCKS_TAGS.LIST],
      }),
      removeStock: builder.mutation({
         query: (data) => ({
            url: `/v1/stocks/${data.inventory_stock_id}`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: [INVENTORY_TAGS.DETAIL, STOCKS_TAGS.LIST],
      }),
      flushExpiredStocks: builder.mutation({
         query: (data) => ({
            url: `/v1/stocks/flush-expired`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: [INVENTORY_TAGS.LIST, STOCKS_TAGS.LIST, INVENTORY_TAGS.DETAIL],
      }),
      adjustStocks: builder.mutation({
         query: (data) => ({
            url: `/v1/stocks/${data.inventory_stock_id}/adjust`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: [INVENTORY_TAGS.DETAIL, STOCKS_TAGS.LIST],
      }),
      updateStockExpiry: builder.mutation({
         query: (data) => ({
            url: `/v1/stocks/${data.inventory_stock_id}/expiry`,
            method: "PATCH",
            body: data,
         }),
         invalidatesTags: [INVENTORY_TAGS.DETAIL, STOCKS_TAGS.LIST],
      }),
      getAllStockApprovals: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/approvals?${queryParams}`;
         },
         providesTags: [APPROVAL_TAGS.LIST],
      }),
      approveStockApproval: builder.mutation({
         query: (data) => ({
            url: `/v1/approvals/${data.id}/approve`,
            method: "PATCH",
            body: data,
         }),
         invalidatesTags: [APPROVAL_TAGS.LIST, STOCKS_TAGS.LIST, INVENTORY_TAGS.DETAIL],
      }),
      rejectStockApproval: builder.mutation({
         query: (data) => ({
            url: `/v1/approvals/${data.id}/reject`,
            method: "PATCH",
            body: data,
         }),
         invalidatesTags: [APPROVAL_TAGS.LIST, STOCKS_TAGS.LIST, INVENTORY_TAGS.DETAIL],
      }),
      getUserStockRequests: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/approvals/user-requests?${queryParams}`;
         },
         providesTags: [APPROVAL_TAGS.LIST],
      }),
      getInventoryAuditTrails: builder.query({
         query: ({ id, ...params }) => {
            const queryParams = urlParams(params);
            return `/v1/inventory/${id}/audit-trails?${queryParams}`;
         },
         providesTags: [INVENTORY_TAGS.DETAIL],
      }),
   }),
});

export const {
   useGetInventoryListQuery,
   useGetInventoryAsOptionsQuery,
   useGetInventoryAsOptionsPaginatedQuery,
   useGetInventoryListWithStockQuery,
   useGetReportDashboardStatusQuery,
   useGetReorderReportQuery,
   useGetInventoryStatusReportQuery,
   useGetVelocityReportQuery,
   useGetInventoryByIdQuery,
   useCreateNewItemMutation,
   useEditItemMutation,
   useDeleteItemMutation,
   useBulkCreateItemsMutation,
   useGetInventoryStockListQuery,
   useGetInventoryStocksQuery,
   useGetInventoryStockByIdQuery,
   useCreateStockMutation,
   useBulkCreateStocksMutation,
   useRemoveStockMutation,
   useFlushExpiredStocksMutation,
   useAdjustStocksMutation,
   useUpdateStockExpiryMutation,
   useGetAllStockApprovalsQuery,
   useApproveStockApprovalMutation,
   useRejectStockApprovalMutation,
   useGetUserStockRequestsQuery,
   useGetInventoryAuditTrailsQuery,
} = inventoryApi;

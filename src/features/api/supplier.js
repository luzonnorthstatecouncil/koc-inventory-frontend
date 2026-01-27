import { SUPPLIER_TAGS } from "@/constants/redux-tags";
import { urlParams } from "@/helpers/urlParams";
import { baseQuery } from "@/lib/utils";
import { createApi } from "@reduxjs/toolkit/query/react";

export const supplierApi = createApi({
   reducerPath: "supplierApi",
   baseQuery: baseQuery,
   endpoints: (builder) => ({
      getSupplierList: builder.query({
         query: (params = {}) => {
            const queryParams = urlParams(params);
            return `/v1/supplier?${queryParams}`;
         },
         providesTags: [SUPPLIER_TAGS.LIST],
      }),
      getSupplierById: builder.query({
         query: (id) => `/v1/supplier/${id}`,
         providesTags: [SUPPLIER_TAGS.DETAIL],
      }),
      createSupplier: builder.mutation({
         query: (data) => ({
            url: `/v1/supplier`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: [SUPPLIER_TAGS.LIST],
      }),
      updateSupplier: builder.mutation({
         query: (data) => ({
            url: `/v1/supplier/${data.id}`,
            method: "PUT",
            body: data,
         }),
         invalidatesTags: [SUPPLIER_TAGS.DETAIL, SUPPLIER_TAGS.LIST],
      }),
      deleteSupplier: builder.mutation({
         query: (id) => ({
            url: `/v1/supplier/${id}`,
            method: "DELETE",
         }),
         invalidatesTags: [SUPPLIER_TAGS.LIST],
      }),
   }),
});

export const {
   useGetSupplierListQuery,
   useGetSupplierByIdQuery,
   useCreateSupplierMutation,
   useUpdateSupplierMutation,
   useDeleteSupplierMutation,
} = supplierApi;

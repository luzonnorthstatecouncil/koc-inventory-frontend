import { KIT_TAGS } from "@/constants/redux-tags";
import { baseQuery } from "@/lib/utils";
import { createApi } from "@reduxjs/toolkit/query/react";
import { urlParams } from "@/helpers/urlParams";

export const kitApi = createApi({
   reducerPath: "kitApi",
   baseQuery: baseQuery,
   endpoints: (builder) => ({
      getKitList: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/kits?${queryParams}`;
         },
         providesTags: [KIT_TAGS.LIST],
      }),
      getKitById: builder.query({
         query: (id) => `/v1/kits/${id}`,
         providesTags: [KIT_TAGS.DETAIL],
      }),
      createNewKit: builder.mutation({
         query: (data) => ({
            url: `/v1/kits`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: [KIT_TAGS.LIST],
      }),
      editKit: builder.mutation({
         query: (data) => ({
            url: `/v1/kits/${data.id}`,
            method: "PUT",
            body: data,
         }),
         invalidatesTags: [KIT_TAGS.DETAIL, KIT_TAGS.LIST],
      }),
      deleteKit: builder.mutation({
         query: (data) => ({
            url: `/v1/kits/${data.id}`,
            method: "DELETE",
         }),
         invalidatesTags: [KIT_TAGS.LIST],
      }),
   }),
});

export const {
   useGetKitListQuery,
   useGetKitByIdQuery,
   useCreateNewKitMutation,
   useEditKitMutation,
   useDeleteKitMutation,
} = kitApi;

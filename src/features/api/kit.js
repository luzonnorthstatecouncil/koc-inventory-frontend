import { INVENTORY_TAGS, KIT_TAGS } from "@/constants/redux-tags";
import { baseApi } from "./baseApi";
import { urlParams } from "@/helpers/urlParams";

export const kitApi = baseApi.injectEndpoints({
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
      // Read-only, but POST because it takes the (unsaved) component list as a body
      getKitCapacity: builder.query({
         query: (body) => ({ url: `/v1/kits/capacity`, method: "POST", body }),
         extraOptions: { silent: true },
         providesTags: [KIT_TAGS.LIST, INVENTORY_TAGS.LIST],
      }),
      createNewKit: builder.mutation({
         query: (data) => ({
            url: `/v1/kits`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: [KIT_TAGS.LIST, INVENTORY_TAGS.LIST],
      }),
      editKit: builder.mutation({
         query: (data) => ({
            url: `/v1/kits/${data.id}`,
            method: "PUT",
            body: data,
         }),
         invalidatesTags: [KIT_TAGS.DETAIL, KIT_TAGS.LIST, INVENTORY_TAGS.LIST],
      }),
      deleteKit: builder.mutation({
         query: (data) => ({
            url: `/v1/kits/${data.id}`,
            method: "DELETE",
         }),
         invalidatesTags: [KIT_TAGS.LIST, INVENTORY_TAGS.LIST],
      }),
   }),
});

export const {
   useGetKitListQuery,
   useGetKitByIdQuery,
   useGetKitCapacityQuery,
   useCreateNewKitMutation,
   useEditKitMutation,
   useDeleteKitMutation,
} = kitApi;

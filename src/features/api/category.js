import { CATEGORY_TAGS } from "@/constants/redux-tags";
import { baseApi } from "./baseApi";

export const categoryApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getCategoryList: builder.query({
         query: () => "/v1/category",
         providesTags: [CATEGORY_TAGS],
      }),
   }),
});

export const { useGetCategoryListQuery } = categoryApi;

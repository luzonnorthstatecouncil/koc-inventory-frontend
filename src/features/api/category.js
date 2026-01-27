import { CATEGORY_TAGS } from "@/constants/redux-tags";
import { baseQuery } from "@/lib/utils";
import { createApi } from "@reduxjs/toolkit/query/react";

export const categoryApi = createApi({
   reducerPath: "categoryApi",
   baseQuery: baseQuery,
   endpoints: (builder) => ({
      getCategoryList: builder.query({
         query: () => "/v1/category",
         providesTags: [CATEGORY_TAGS],
      }),
   }),
});

export const { useGetCategoryListQuery } = categoryApi;

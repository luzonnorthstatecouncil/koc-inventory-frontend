import { ACTIVITY_LOG_TAGS } from "@/constants/redux-tags";
import { urlParams } from "@/helpers/urlParams";
import { baseQuery } from "@/lib/utils";
import { createApi } from "@reduxjs/toolkit/query/react";

export const activityLogApi = createApi({
   reducerPath: "activityLogApi",
   baseQuery: baseQuery,
   endpoints: (builder) => ({
      getLogs: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/logs?${queryParams}`;
         },
         providesTags: [ACTIVITY_LOG_TAGS],
      }),
   }),
});

export const { useGetLogsQuery } = activityLogApi;

import { ACTIVITY_LOG_TAGS } from "@/constants/redux-tags";
import { urlParams } from "@/helpers/urlParams";
import { baseApi } from "./baseApi";

export const activityLogApi = baseApi.injectEndpoints({
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

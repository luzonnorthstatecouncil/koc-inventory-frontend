import { ORDER_TAGS, SHIFT_TAGS } from "@/constants/redux-tags";
import { urlParams } from "@/helpers/urlParams";
import { baseApi } from "./baseApi";

/** Cashier shifts: open with a float, X reading while open, close with the counted cash (Z reading). */
export const shiftApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      // { shift: null } when none is open, otherwise the live X reading { reading, shift, summary, cash }
      getCurrentShift: builder.query({
         query: () => "/v1/shifts/current",
         providesTags: [SHIFT_TAGS],
      }),
      getShifts: builder.query({
         query: (params) => `/v1/shifts?${urlParams(params)}`,
         providesTags: [SHIFT_TAGS],
      }),
      getShiftReport: builder.query({
         query: (id) => `/v1/shifts/${id}/report`,
         providesTags: [SHIFT_TAGS],
      }),
      openShift: builder.mutation({
         query: (data) => ({ url: "/v1/shifts/open", method: "POST", body: data }),
         invalidatesTags: [SHIFT_TAGS],
      }),
      closeShift: builder.mutation({
         query: ({ id, ...data }) => ({ url: `/v1/shifts/${id}/close`, method: "POST", body: data }),
         invalidatesTags: [SHIFT_TAGS, ORDER_TAGS],
      }),
   }),
});

export const {
   useGetCurrentShiftQuery,
   useGetShiftsQuery,
   useGetShiftReportQuery,
   useOpenShiftMutation,
   useCloseShiftMutation,
} = shiftApi;

import { USER_TAGS } from "@/constants/redux-tags";
import { baseQuery } from "@/lib/utils";
import { createApi } from "@reduxjs/toolkit/query/react";

export const authApi = createApi({
   reducerPath: "api",
   baseQuery: baseQuery,
   endpoints: (builder) => ({
      signInUser: builder.mutation({
         query: (data) => ({
            url: "/v1/auth/login",
            method: "POST",
            body: data,
         }),
      }),
      signOutUser: builder.mutation({
         query: ({ token }) => ({
            url: "/v1/auth/logout",
            method: "POST",
            body: { token },
         }),
      }),
      checkSession: builder.query({
         query: () => `/v1/auth/check?t=${Date.now()}`,
      }),
   }),
});

export const { useCheckSessionQuery, useSignInUserMutation, useSignOutUserMutation } = authApi;

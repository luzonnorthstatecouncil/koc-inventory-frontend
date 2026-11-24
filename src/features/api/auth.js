import { USER_TAGS } from "@/constants/redux-tags";
import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
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

import { USER_TAGS } from "@/constants/redux-tags";
import { baseQuery } from "@/lib/utils";
import { createApi } from "@reduxjs/toolkit/query/react";
import { urlParams } from "@/helpers/urlParams";

export const userApi = createApi({
   reducerPath: "userApi",
   baseQuery: baseQuery,
   endpoints: (builder) => ({
      getUserList: builder.query({
         query: (params) => {
            const queryParams = urlParams(params);
            return `/v1/users?${queryParams}`;
         },
         providesTags: [USER_TAGS.LIST],
      }),
      getAuthUser: builder.query({
         query: () => "/v1/users/profile",
         providesTags: [USER_TAGS.PROFILE],
      }),
      createUser: builder.mutation({
         query: (data) => ({
            url: `/v1/users`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: [USER_TAGS.LIST],
      }),
      updateUser: builder.mutation({
         query: (data) => ({
            url: `/v1/users/${data.id}`,
            method: "PUT",
            body: data,
         }),
         invalidatesTags: [USER_TAGS.DETAIL, USER_TAGS.PROFILE, USER_TAGS.LIST],
      }),
      resetPassword: builder.mutation({
         query: (userId) => ({
            url: `/v1/users/${userId}/reset-password`,
            method: "POST",
         }),
      }),
      deleteUser: builder.mutation({
         query: (userId) => ({
            url: `/v1/users/${userId}`,
            method: "DELETE",
         }),
         invalidatesTags: [USER_TAGS.LIST],
      }),
      updatePersonalInfo: builder.mutation({
         query: (data) => ({
            url: `/v1/users/profile/personal-info`,
            method: "PUT",
            body: data,
         }),
         invalidatesTags: [USER_TAGS.PROFILE],
      }),
      updateAccountDetails: builder.mutation({
         query: (data) => ({
            url: `/v1/users/profile/account-details`,
            method: "PUT",
            body: data,
         }),
         invalidatesTags: [USER_TAGS.PROFILE],
      }),
   }),
});

export const {
   useGetUserListQuery,
   useGetAuthUserQuery,
   useCreateUserMutation,
   useUpdateUserMutation,
   useResetPasswordMutation,
   useDeleteUserMutation,
   useUpdatePersonalInfoMutation,
   useUpdateAccountDetailsMutation,
} = userApi;

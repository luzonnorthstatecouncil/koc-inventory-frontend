import { logout } from "@/features/slice/userSlice";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
   return twMerge(clsx(inputs));
}

const rawBaseQuery = fetchBaseQuery({
   baseUrl: "/asd/api/v1",
   prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("token");
      if (token) {
         headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
   },
});

// Track unauthorized state to prevent subsequent requests
let isUnauthorized = false;

// Global error handler wrapper
export const baseQuery = async (args, api, extraOptions) => {
   // Block all requests if already unauthorized
   if (isUnauthorized) {
      api.dispatch(logout());

      return {
         error: {
            status: 401,
            data: { message: "Session expired. Please log in again." },
         },
      };
   }

   const result = await rawBaseQuery(args, api, extraOptions);

   // 🔐 Handle global errors
   if (result.error) {
      if (result.error.status === 401) {
         isUnauthorized = true;
         api.dispatch(logout());
         toast.error("Session expired. Please log in again.");
      } else {
         toast.error(result.error.data?.message || result.error.data?.error || "An error occurred");
      }
   }

   return result;
};

// Reset unauthorized state (call this on successful login)
export const resetAuthState = () => {
   isUnauthorized = false;
};

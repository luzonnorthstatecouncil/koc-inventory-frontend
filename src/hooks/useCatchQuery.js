import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "@/features/slice/loading";

/**
 * Custom hook to wrap async queries/mutations with loading state
 */
export const useCatchQuery = () => {
   const dispatch = useDispatch();

   const run = async (asyncFn, args) => {
      dispatch(showLoading());

      try {
         const result = await asyncFn(args);
         const hasError = Boolean(result?.error?.data);

         if (result?.error && result.error.status === "FETCH_ERROR") {
            return { success: false, message: "Network error. Please check your connection." };
         }

         if (hasError) {
            return {
               success: false,
               message: result?.error?.data?.message || "Something went wrong.",
            };
         }

         return {
            success: true,
            message: result?.data.message,
            result: result?.data,
         };
      } finally {
         dispatch(hideLoading());
      }
   };

   return run;
};

/**
 * Wraps an RTK Query mutation/query call and normalises its result. Loading is shown where the
 * request starts (the button, form or page), not globally.
 */
export const useCatchQuery = () => {
   const run = async (asyncFn, args) => {
      const result = await asyncFn(args);
      const hasError = Boolean(result?.error?.data);

      if (result?.error && result.error.status === "FETCH_ERROR") {
         return { success: false, message: "Network error. Please check your connection." };
      }

      if (hasError) {
         return {
            success: false,
            message: result?.error?.data?.message || "Something went wrong.",
            errors: result?.error?.data?.errors ?? null,
         };
      }

      return {
         success: true,
         message: result?.data.message,
         result: result?.data,
      };
   };

   return run;
};

/**
 * Helper function to format URL search parameters with validation
 * Excludes empty, null, undefined values and handles special cases
 *
 * @param {Object} params - Parameters object from DataTable
 * @returns {string} - Formatted URL search parameters string
 */
export const urlParams = (params = {}) => {
   const cleanParams = {};

   // Helper function to check if value is empty
   const isEmpty = (value) => {
      if (value === null || value === undefined || value === "") return true;
      if (typeof value === "string" && value.trim() === "") return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (typeof value === "object" && Object.keys(value).length === 0) return true;
      return false;
   };

   // Helper function to check if value should be excluded
   const shouldExclude = (value) => {
      if (isEmpty(value)) return true;
      if (value === "all" || value === "undefined") return true;
      return false;
   };

   Object.entries(params).forEach(([key, value]) => {
      // Skip if value should be excluded
      if (shouldExclude(value)) return;

      // Handle special DataTable parameters
      switch (key) {
         case "search":
            // Only include search if it has meaningful content
            if (typeof value === "string" && value.trim().length > 0) {
               cleanParams.search = value.trim();
            }
            break;

         case "filters":
            // Handle filters object - flatten and validate each filter
            if (typeof value === "object" && value !== null) {
               Object.entries(value).forEach(([filterKey, filterValue]) => {
                  if (!shouldExclude(filterValue)) {
                     cleanParams[filterKey] = filterValue;
                  }
               });
            }
            break;

         case "dateRange":
            // Handle date range object
            if (typeof value === "object" && value !== null) {
               if (value.from && !isEmpty(value.from)) {
                  cleanParams.dateFrom = value.from instanceof Date ? value.from.toISOString() : value.from;
               }
               if (value.to && !isEmpty(value.to)) {
                  cleanParams.dateTo = value.to instanceof Date ? value.to.toISOString() : value.to;
               }
            }
            break;

         case "page":
            // Always include page, default to 1 if invalid
            const pageNum = parseInt(value);
            cleanParams.page = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
            break;

         case "pageSize":
            // Always include pageSize, default to 25 if invalid
            const pageSizeNum = parseInt(value);
            const validPageSizes = [5, 10, 25, 50, 100];
            cleanParams.pageSize = validPageSizes.includes(pageSizeNum) ? pageSizeNum : 25;
            break;

         case "sortBy":
         case "sortDirection":
            // Include sorting parameters if valid
            if (typeof value === "string" && value.trim().length > 0) {
               cleanParams[key] = value.trim();
            }
            break;

         default:
            // For any other parameters, include if not empty
            if (!shouldExclude(value)) {
               cleanParams[key] = value;
            }
            break;
      }
   });

   // Convert to URLSearchParams and return as string
   const searchParams = new URLSearchParams();

   Object.entries(cleanParams).forEach(([key, value]) => {
      searchParams.append(key, String(value));
   });

   return searchParams.toString();
};

/**
 * Helper function specifically for DataTable query parameters
 * Handles the exact structure that DataTable sends to RTK Query
 *
 * @param {Object} params - DataTable query parameters
 * @returns {string} - Formatted URL search parameters string
 */
export const tableUrlParams = (params = {}) => {
   const {
      page = 1,
      pageSize = 25,
      search = "",
      filters = {},
      dateRange = {},
      sortBy = "",
      sortDirection = "",
      ...otherParams
   } = params;

   return urlParams({
      page,
      pageSize,
      search,
      filters,
      dateRange,
      sortBy,
      sortDirection,
      ...otherParams,
   });
};

/**
 * Helper function to debug URL parameters
 * Useful for development to see what parameters are being sent
 *
 * @param {Object} params - Parameters object
 * @returns {Object} - Object with original params, cleaned params, and URL string
 */
export const debugUrlParams = (params = {}) => {
   const urlString = urlParams(params);
   const urlParams = new URLSearchParams(urlString);
   const cleanedParams = Object.fromEntries(urlParams.entries());

   return {
      original: params,
      cleaned: cleanedParams,
      urlString,
      isEmpty: urlString === "",
   };
};

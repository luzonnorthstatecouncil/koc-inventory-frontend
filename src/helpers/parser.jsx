import { formatDate, isDate } from "date-fns";

export const priceParser = (current) => {
   return current
      ? `PHP ${Number(current).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "PHP 0.00";
};

export const dateParser = (dateString, format = "PPp") => {
   if (!dateString) return "---";

   const date = new Date(dateString);
   if (!isDate(date) || isNaN(date.getTime())) return "---";

   return formatDate(date, format);
};

export const optionParser = (options, value, labelKeys, config = {}) => {
   if (!Array.isArray(options) || options.length === 0) return [];

   return options.map((opt) => {
      let label = "";

      if (Array.isArray(labelKeys)) {
         label = labelKeys
            .map((k) => opt[k])
            .filter(Boolean)
            .join(config?.separator ?? " - ");
      } else {
         const val = opt[labelKeys];
         label = typeof val === "object" ? Object.values(val).join(config?.separator ?? " - ") : String(val ?? "");
      }

      return { value: String(opt[value]), label };
   });
};

export const nestedObjParser = (errorsObj, path) => {
   if (!path) return undefined;
   const parts = path.match(/[^.[\]]+/g) || [];
   return parts.reduce((acc, key) => (acc ? acc[key] : undefined), errorsObj);
};

export const parseArray = (array, key, value) => {
   if (!Array.isArray(array)) return {};

   return array.reduce((acc, item) => {
      acc[item[key]] = item[value];
      return acc;
   }, {});
};

export const arrayFromObject = (obj, key, value) => {
   if (typeof obj !== "object" || obj === null) return [];

   return Object.entries(obj).map(([k, v]) => ({
      [key]: k,
      [value]: v,
   }));
};

export const addOthers = (options, others = "Others") => [...options, { value: "others", label: others }];

export const padwithZero = (num, length = 4) => String(num).padStart(length, "0");

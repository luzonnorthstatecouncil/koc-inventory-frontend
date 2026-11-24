import z from "zod";
import { stringNumberRequired, stringOptional, stringRequired } from "../helpers";

export const VOID_REASONS_OPTIONS = [
   { value: "Rang up the wrong item", label: "Rang up the wrong item" },
   { value: "Wrong quantity", label: "Wrong quantity" },
   { value: "Customer cancelled before paying", label: "Customer cancelled before paying" },
   { value: "Duplicate sale", label: "Duplicate sale" },
   { value: "Other", label: "Other" },
];

export const voidOrderDefaultValues = {
   id: null,
   reason: "",
   reason_details: "",
};

export const voidOrderSchema = z
   .object({
      id: stringNumberRequired(),
      reason: stringRequired("A reason"),
      reason_details: stringOptional(),
   })
   .refine((data) => data.reason !== "Other" || data.reason_details, {
      message: "Say why this sale is being voided",
      path: ["reason_details"],
   });

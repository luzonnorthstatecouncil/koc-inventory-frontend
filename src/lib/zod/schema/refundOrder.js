import z from "zod";
import { stringNumberRequired, stringOptional, stringRequired } from "../helpers";

export const refundOrderDefaultValues = {
   id: null,
   reason: "",
   reason_details: "",
};

export const refundOrderSchema = z
   .object({
      id: stringNumberRequired(),
      reason: stringRequired(),
      reason_details: stringOptional(),
   })
   .refine((data) => data.reason !== "Other" || data.reason_details, {
      message: "State additional refund reasons",
      path: ["reason_details"],
   });

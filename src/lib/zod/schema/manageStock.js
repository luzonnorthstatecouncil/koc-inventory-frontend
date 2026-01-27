import z, { number, string } from "zod";
import {
   numberOptional,
   numberRequired,
   positiveNumber,
   stringOrNumberOptional,
   stringNumberRequired,
   stringOptional,
   stringRequired,
} from "../helpers";
import { format } from "date-fns";

export const manageStockDefaultValues = {
   type: "stock_in",
   quantity: 0,
   inventory_stock_id: null,
   inventory_id: null,
   supplier_id: null,
   variant_id: null,
   remarks: "",
   remarks_others: "",
   reference_no: "",
   received_at: format(new Date(), "yyyy-MM-dd"),
   has_expiry: false,
};

export const manageStockSchema = z
   .object({
      type: stringRequired(),
      expires_at: stringOptional(),
      received_at: stringOptional(),
      quantity: stringOrNumberOptional(),
      inventory_stock_id: stringOptional(),
      inventory_id: stringOrNumberOptional(),
      supplier_id: stringOrNumberOptional(),
      remarks: stringOptional(),
      remarks_others: stringOptional(),
      variant_id: stringOrNumberOptional(),
      reference_no: stringOptional(),
      has_expiry: z.boolean().optional(),
   })
   .refine((data) => data.type !== "stock_in" || data.variant_id, {
      message: "Select from the existing items to add stock.",
      path: ["variant_id"],
   })
   .refine((data) => data.type !== "stock_out" || data.inventory_stock_id, {
      message: "Select from the existing batches to remove stock.",
      path: ["inventory_stock_id"],
   })
   .refine((data) => data.type !== "stock_in" || data.received_at, {
      message: "Received date is required when Stock In is selected.",
      path: ["received_at"],
   })
   .refine((data) => data.type !== "stock_in" || data.supplier_id, {
      message: "Supplier is required when Stock In is selected.",
      path: ["supplier_id"],
   })
   .refine((data) => !data.has_expiry || data.expires_at, {
      message: "Expiration date is required for items with expiry tracking.",
      path: ["expires_at"],
   })
   .refine((data) => data.quantity > 0, {
      message: "Quantity must be greater than 0.",
      path: ["quantity"],
   })
   .refine((data) => data.type !== "stock_out" || data.remarks, {
      message: "Remarks is required when Stock Out is selected.",
      path: ["remarks"],
   })
   .refine((data) => data.remarks !== "others" || data.remarks_others, {
      message: "Other reason is required when Others is selected.",
      path: ["remarks_others"],
   });

export const editStockDefaultValues = {
   inventory_stock_id: null,
   quantity: 0,
   remarks: "",
   remarks_others: "",
};

export const editStockSchema = z
   .object({
      inventory_stock_id: stringNumberRequired(),
      quantity: stringNumberRequired(),
      remarks: stringRequired(),
      remarks_others: stringOptional(),
   })
   .refine((data) => data.remarks !== "others" || data.remarks_others, {
      message: "State other reason",
      path: ["remarks_others"],
   });

export const rejectStockApprovalSchema = z.object({
   id: numberRequired(),
   rejection_reason: stringRequired(),
});

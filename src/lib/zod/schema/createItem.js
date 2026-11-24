import z from "zod";
import {
   alphaRequired,
   booleanRequired,
   nameRequired,
   numberRequired,
   positiveNumber,
   stringOrNumberOptional,
   stringOptional,
   stringRequired,
} from "../helpers";

export const createItemSpecificationDefaultValues = {
   specification_name: "",
   specification_value: "",
};

export const createItemVariantDefaultValues = {
   id: crypto.randomUUID(),
   variant_name: "",
   reorder_level: 5,
   safe_qty_level: 10,
   max_qty_level: 20,
};

export const createItemVariantSchema = z
   .object({
      id: stringOrNumberOptional(),
      variant_name: stringRequired(),

      // Stocks
      reorder_level: numberRequired(),
      safe_qty_level: numberRequired(),
      max_qty_level: numberRequired(),
   })
   .refine((data) => data.reorder_level <= data.safe_qty_level, {
      message: "Reorder level must not exceed safe quantity level",
      path: ["reorder_level"],
   })
   .refine((data) => data.reorder_level <= data.max_qty_level, {
      message: "Reorder level must not exceed max quantity level",
      path: ["reorder_level"],
   })
   .refine((data) => data.safe_qty_level >= data.reorder_level, {
      message: "Safe quantity level must not be lower than reorder level",
      path: ["safe_qty_level"],
   })
   .refine((data) => data.safe_qty_level <= data.max_qty_level, {
      message: "Safe quantity level must not exceed max quantity level",
      path: ["safe_qty_level"],
   })
   .refine((data) => data.max_qty_level >= data.reorder_level && data.max_qty_level >= data.safe_qty_level, {
      message: "Max quantity level must be greater than reorder and safe quantity levels",
      path: ["max_qty_level"],
   });

export const createItemDefaultValues = {
   name: "",
   category_id: "",
   status: true,
   has_expiry: false,
   unit: "",
   price: 0.0,
   quantity: 0,
   current_qty: 0,
   reorder_level: 5,
   safe_qty_level: 10,
   max_qty_level: 20,
   expires_at: "",
   supplier_id: "",
   remarks: "",
   variants: [createItemVariantDefaultValues],
};

export const createItemSchema = z
   .object({
      // Details
      name: nameRequired(),
      price: positiveNumber(),
      category_id: stringRequired(),
      status: booleanRequired(),
      unit: alphaRequired(),
      has_expiry: booleanRequired(),
      description: stringOptional(),

      // Variants
      variants: z.array(createItemVariantSchema),
   })
   .superRefine((data, ctx) => {
      if (data.current_qty > 0) {
         const supplierId = data.supplier_id;
         if (!supplierId) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Supplier is required for items with initial quantity greater than 0.",
               path: ["supplier_id"],
            });
         }
      }
   });

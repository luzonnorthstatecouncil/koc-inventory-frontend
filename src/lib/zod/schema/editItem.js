import z from "zod";
import {
   alphaRequired,
   booleanRequired,
   nameRequired,
   numberRequired,
   positiveNumber,
   referenceNumberRequired,
   referenceNumberOptional,
   stringRequired,
   stringOrNumberOptional,
} from "../helpers";
import { createItemVariantSchema } from "./createItem";

export const editItemSpecificationDefaultValues = {
   specification_name: "",
   specification_value: "",
};

export const editItemVariantDefaultValues = {
   id: crypto.randomUUID(),
   variant_name: "",
   reorder_level: 5,
   safe_qty_level: 10,
   max_qty_level: 20,
};

export const editItemVariantSchema = createItemVariantSchema;

export const editItemSchema = z.object({
   // Details
   sku: referenceNumberOptional(),
   serial_number: referenceNumberRequired(),
   name: nameRequired(),
   price: positiveNumber(),
   category_id: stringRequired(),
   status: booleanRequired(),
   unit: alphaRequired(),

   // Variants
   variants: z.array(editItemVariantSchema),
});

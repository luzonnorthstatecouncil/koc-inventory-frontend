import { z } from "zod";
import {
   numberRequired,
   priceRequired,
   stringNumberRequired,
   stringOrNumberOptional,
   stringRequired,
} from "../helpers";

export const createKitSchema = z.object({
   name: stringRequired("Name"),
   sku: stringRequired("SKU"),
   price: priceRequired("Price"),
   category_id: stringOrNumberOptional(),
   locked_qty: numberRequired("Locked quantity")
      .min(0, "Locked quantity must be at least 0")
      .default(0),
   status: z.string().default("active"),
   items: z
      .array(
         z.object({
            variant_id: stringNumberRequired("Item"),
            quantity: numberRequired("Quantity").min(1, "Quantity must be at least 1"),
         }),
      )
      .min(1, "At least one item is required in a kit"),
});

export const createKitDefaultValues = {
   name: "",
   sku: "",
   price: 0,
   locked_qty: 0,
   status: "active",
   items: [{ variant_id: "", quantity: 1 }],
};

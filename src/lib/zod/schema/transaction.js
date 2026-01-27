import { z } from "zod";
import { numberRequired, positiveNumber, stringNumberRequired, stringRequired } from "../helpers";

export const posTransactionSchema = z.object({
   cart: z
      .array(
         z.object({
            id: numberRequired(),
            quantity: positiveNumber(),
         })
      )
      .min(1, "Cart cannot be empty"),
   paymentMethod: stringRequired(),
   subtotal: z.number().min(0, "Subtotal must be positive"),
   total: z.number().min(0, "Total must be positive"),
});

// Schema for validating individual cart items when adding
export const cartItemSchema = z.object({
   id: numberRequired(),
   name: stringRequired(),
   sku: stringRequired("SKU"),
   price: stringNumberRequired("Price"),
   quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
});

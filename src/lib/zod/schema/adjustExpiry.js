import z from "zod";
import { stringRequired } from "../helpers";

export const adjustExpiryDefaultValues = {
   expires_at: "",
};

export const adjustExpirySchema = z.object({
   expires_at: stringRequired("Expiration date is required"),
});

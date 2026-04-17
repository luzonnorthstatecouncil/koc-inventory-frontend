import z from "zod";
import { booleanRequired, nameRequired } from "../helpers";

export const supplierDefaultValues = {
   name: "",
   status: true,
};

export const supplierSchema = z.object({
   name: nameRequired(),
   status: booleanRequired(),
});

import z from "zod";
import { stringOptional } from "../helpers";

export const searchSchema = z.object({
   search: stringOptional(),
   category: stringOptional(),
});

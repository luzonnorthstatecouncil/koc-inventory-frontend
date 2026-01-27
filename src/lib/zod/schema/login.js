import { z } from "zod";
import { stringRequired } from "../helpers";

export const loginSchema = z.object({
   username: stringRequired(),
   password: stringRequired(),
});

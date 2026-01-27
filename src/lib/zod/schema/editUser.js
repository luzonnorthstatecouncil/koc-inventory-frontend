import z from "zod";
import { booleanRequired, emailRequired, stringNumberRequired, stringRequired } from "../helpers";

export const editUserSchema = z.object({
   id: stringNumberRequired(),
   full_name: stringRequired("Full name"),
   email: emailRequired(),
   username: stringRequired("Username"),
   role: stringRequired("Role"),
   status: booleanRequired("Status"),
});

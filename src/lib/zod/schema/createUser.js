import z from "zod";
import { booleanRequired, emailRequired, passwordOptional, stringRequired } from "../helpers";

export const createUserDefaultValues = {
   full_name: "",
   email: "",
   username: "",
   role: "user",
   status: true,
};

export const createUserSchema = z.object({
   full_name: stringRequired("Full name"),
   email: emailRequired(),
   username: stringRequired("Username"),
   role: stringRequired("Role"),
   status: booleanRequired("Status"),
   new_password: passwordOptional(),
});

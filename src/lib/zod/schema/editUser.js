import z from "zod";
import { booleanRequired, emailRequired, stringNumberRequired, stringOptional, stringRequired } from "../helpers";

export const editUserSchema = z.object({
   id: stringNumberRequired(),
   full_name: stringRequired("Full name"),
   email: emailRequired(),
   username: stringRequired("Username"),
   role: stringRequired("Role"),
   status: booleanRequired("Status"),
});

export const changePasswordSchema = z
   .object({
      new_password: stringOptional("New password"),
      confirm_new_password: stringOptional("Confirm new password"),
      manual: booleanRequired("Manual change"),
   })
   .superRefine((data, ctx) => {
      if (data.manual) {
         if (!data.new_password) {
            ctx.addIssue({
               code: z.ZodIssueCode.invalid_type,
               expected: "string",
               received: "undefined",
               path: ["new_password"],
               message: "New password is required when manual change is selected",
            });
         }

         if (!data.confirm_new_password) {
            ctx.addIssue({
               code: z.ZodIssueCode.invalid_type,
               expected: "string",
               received: "undefined",
               path: ["confirm_new_password"],
               message: "Confirm new password is required when manual change is selected",
            });
         }
      }
   })

   .refine((data) => data.new_password === data.confirm_new_password, {
      message: "Passwords do not match",
      path: ["confirm_new_password"],
   });

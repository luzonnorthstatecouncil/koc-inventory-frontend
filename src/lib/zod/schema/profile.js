import { z } from "zod";
import { stringRequired } from "../helpers";

export const userInfoSchema = z.object({
   fullname: stringRequired().min(2, "Full name must be at least 2 characters long."),
   email: stringRequired().email("Invalid email address."),
});

export const accountDetailsSchema = z.object({
   username: stringRequired().min(3, "Username must be at least 3 characters long."),
});

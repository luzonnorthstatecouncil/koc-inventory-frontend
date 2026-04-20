import { z } from "zod";

// 🔤 Strings
export const stringRequired = (field = "This field") => z.string().min(1, `${field} is required`);

export const stringOptional = () => z.string().nullable().optional();

export const trimmedString = (field = "This field") => z.string().trim().min(1, `${field} is required`);

// 📧 Email
export const emailRequired = () => z.string().min(1, "Email is required").email("Invalid email format");

// 🔐 Passwords
export const passwordOptional = (min = 6) =>
   z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || val.length >= min, `Password must be at least ${min} characters`);

export const passwordRequired = (min = 6) =>
   z.string().min(1, "Password is required").min(min, `Password must be at least ${min} characters`);

export const confirmPassword = (field = "Confirm password") => z.string().min(1, `${field} is required`);

// 🔢 Numbers
export const numberOptional = () => z.number().optional().nullable();

export const numberRequired = (field = "This field") =>
   z
      .number({
         required_error: `${field} is required`,
         invalid_type_error: `${field} must be a number`,
      })
      .refine((val) => !isNaN(val), `${field} must be a number`);

export const positiveNumber = (field = "This field") => numberRequired(field).positive(`${field} must be positive`);

export const priceOptional = (field = "This field") =>
   numberOptional().refine((val) => val === null || val >= 0, `${field} must be a positive number`);

export const priceRequired = (field = "This field") =>
   z.coerce
      .number({
         required_error: `${field} is required`,
         invalid_type_error: `${field} must be a number`,
      })
      .nonnegative(`${field} must be a positive number`)
      .multipleOf(0.01, `${field} must have at most 2 decimal places`);

export const intRequired = (field = "This field") => numberRequired(field).int(`${field} must be an integer`);

// 📅 Dates
export const dateRequired = (field = "This field") => z.date(`${field} is required`);

// ☎️ Others (patterns)
export const phoneRequired = () =>
   z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\d{10,15}$/, "Invalid phone number");

export const urlRequired = () => z.string().min(1, "URL is required").url("Invalid URL");

export const booleanRequired = (field = "This field") => z.boolean({ required_error: `${field} is required` });

export const stringNumberRequired = (field = "This field") =>
   z
      .union([
         z
            .string()
            .min(1, `${field} is required`)
            .regex(/^\d*\.?\d+$/, `${field} must be a valid number`),
         z.number({ invalid_type_error: `${field} must be a number` }),
      ])
      .transform((val) => {
         // Convert string to number if it's a string
         return typeof val === "string" ? parseFloat(val) : val;
      })
      .refine((val) => !isNaN(val) && isFinite(val), `${field} must be a valid number`);

export const stringOrNumberOptional = () => z.union([z.string(), z.number()]).optional().nullable();

export const alphaNumericRequired = (field = "This field") =>
   z
      .string()
      .min(1, `${field} is required`)
      .regex(/^[a-zA-Z0-9]+$/, `${field} must be alphanumeric`);

export const alphaRequired = (field = "This field") =>
   z
      .string()
      .min(1, `${field} is required`)
      .regex(/^[a-zA-Z]+$/, `${field} must contain only letters`);

export const nameRequired = (field = "This field") =>
   z
      .string()
      .min(3, `${field} must be at least 3 characters`)
      .regex(/^[a-zA-Z0-9\s.,'’-]+$/, `${field} contains invalid characters`);

export const referenceNumberRequired = (field = "This field") =>
   z
      .string()
      .min(1, `${field} is required`)
      .regex(/^[a-zA-Z0-9-]+$/, `${field} contains invalid characters`);

export const referenceNumberOptional = () =>
   z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || /^[a-zA-Z0-9-]+$/.test(val), "This field contains invalid characters");

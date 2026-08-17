import { z } from "zod";
import { emailSchema, passwordRequiredSchema } from "@/src/lib/validation/fields";

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordRequiredSchema,
  rememberMe: z.boolean(),
});

export type LoginValues = z.infer<typeof loginSchema>;

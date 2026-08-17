import { z } from "zod";
import { optionalMax, passwordRequiredSchema, passwordStrongSchema } from "@/src/lib/validation/fields";

export const updateProfileSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120, "Máximo 120 caracteres"),
  apellido: optionalMax(120),
  telefono: optionalMax(40),
});

export const changePasswordSchema = z.object({
  passwordActual: passwordRequiredSchema,
  passwordNueva: passwordStrongSchema,
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

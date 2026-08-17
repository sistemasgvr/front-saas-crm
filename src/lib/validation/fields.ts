import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "El email es obligatorio")
  .pipe(z.email("Email inválido"));

export const passwordRequiredSchema = z.string().min(1, "La contraseña es obligatoria");

export const passwordStrongSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");

export const optionalMax = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);

export const optionalEmail = z.union([z.literal(""), z.email("Email inválido")]);

export const optionalUrl = z.union([z.literal(""), z.url("URL inválida")]);

export const slugSchema = z
  .string()
  .trim()
  .min(1, "El slug es obligatorio")
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones (ej. mi-empresa)");

export const paisSchema = z.string().trim().length(2, "Usa el código ISO de 2 letras (ej. PE)");

export const rolSchema = z.enum(["PROPIETARIO", "ADMINISTRADOR", "USUARIO"]);

export const uuidSchema = z.uuid("Selecciona una empresa");

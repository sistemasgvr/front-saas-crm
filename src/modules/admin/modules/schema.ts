import { z } from "zod";
import { optionalMax } from "@/src/lib/validation/fields";

export const createModuleSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, "El código es obligatorio")
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "Usa MAYUSCULAS_CON_GUION_BAJO"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  icono: optionalMax(80),
  orden: z.number({ error: "El orden es obligatorio" }).int().min(0, "Mínimo 0").max(999, "Máximo 999"),
  descripcion: optionalMax(500),
});

export const updateModuleSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  icono: optionalMax(80),
  orden: z.number({ error: "El orden es obligatorio" }).int().min(0, "Mínimo 0").max(999, "Máximo 999"),
  descripcion: optionalMax(500),
});

export type CreateModuleValues = z.infer<typeof createModuleSchema>;
export type UpdateModuleValues = z.infer<typeof updateModuleSchema>;

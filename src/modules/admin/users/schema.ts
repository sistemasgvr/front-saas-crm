import { z } from "zod";
import { emailSchema, optionalMax, passwordStrongSchema, rolSchema, uuidSchema } from "@/src/lib/validation/fields";

export const createUserSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
    apellido: optionalMax(120),
    email: emailSchema,
    password: passwordStrongSchema,
    telefono: optionalMax(40),
    esAdminPlataforma: z.boolean(),
    organizacionId: z.string(),
    rol: rolSchema,
  })
  .superRefine((data, ctx) => {
    if (data.organizacionId && !uuidSchema.safeParse(data.organizacionId).success) {
      ctx.addIssue({ code: "custom", path: ["organizacionId"], message: "Selecciona una empresa válida" });
    }
  });

export const assignOrgSchema = z.object({
  organizacionId: uuidSchema,
  rol: rolSchema,
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
export type AssignOrgValues = z.infer<typeof assignOrgSchema>;

import { z } from "zod";
import {
  emailSchema,
  optionalEmail,
  optionalMax,
  paisSchema,
  passwordStrongSchema,
  slugSchema,
} from "@/src/lib/validation/fields";

export const createOrganizationSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
    slug: slugSchema,
    razonSocial: optionalMax(255),
    documentoFiscal: optionalMax(50),
    emailContacto: optionalEmail,
    telefonoContacto: optionalMax(40),
    pais: paisSchema,
    zonaHoraria: z.string().trim().min(1, "La zona horaria es obligatoria").max(64),
    primerNombre: z.string().trim(),
    primerApellido: optionalMax(120),
    primerEmail: z.string().trim(),
    primerPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const started = Boolean(data.primerNombre || data.primerEmail || data.primerPassword);
    if (!started) return;

    if (!data.primerNombre) {
      ctx.addIssue({ code: "custom", path: ["primerNombre"], message: "El nombre del usuario es obligatorio" });
    } else if (data.primerNombre.length > 120) {
      ctx.addIssue({ code: "custom", path: ["primerNombre"], message: "Máximo 120 caracteres" });
    }

    const email = emailSchema.safeParse(data.primerEmail);
    if (!email.success) {
      ctx.addIssue({
        code: "custom",
        path: ["primerEmail"],
        message: email.error.issues[0]?.message ?? "Email inválido",
      });
    }

    const password = passwordStrongSchema.safeParse(data.primerPassword);
    if (!password.success) {
      ctx.addIssue({
        code: "custom",
        path: ["primerPassword"],
        message: password.error.issues[0]?.message ?? "Contraseña inválida",
      });
    }
  });

export const updateOrganizationAdminSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  slug: slugSchema,
  razonSocial: optionalMax(255),
  documentoFiscal: optionalMax(50),
  emailContacto: optionalEmail,
  telefonoContacto: optionalMax(40),
  pais: paisSchema,
  zonaHoraria: z.string().trim().min(1, "La zona horaria es obligatoria").max(64),
  notas: optionalMax(2000),
});

export type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationAdminValues = z.infer<typeof updateOrganizationAdminSchema>;

import { z } from "zod";
import { optionalEmail, optionalMax, optionalUrl, paisSchema } from "@/src/lib/validation/fields";

export const organizationSettingsSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  razonSocial: optionalMax(255),
  documentoFiscal: optionalMax(50),
  emailContacto: optionalEmail,
  telefonoContacto: optionalMax(40),
  logoUrl: optionalUrl,
  pais: paisSchema,
  zonaHoraria: z.string().trim().min(1, "La zona horaria es obligatoria").max(64),
});

export type OrganizationSettingsValues = z.infer<typeof organizationSettingsSchema>;

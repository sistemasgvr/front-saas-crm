import { z } from "zod";

const tipo = z.enum([
  "DEPARTAMENTO",
  "CASA",
  "TERRENO",
  "LOCAL",
  "OFICINA",
  "OTRO",
]);
const operacion = z.enum(["VENTA", "ALQUILER"]);
const estadoInmueble = z.enum(["DISPONIBLE", "RESERVADO", "VENDIDO", "INACTIVO"]);

export const inmuebleFormSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, "El código es obligatorio")
    .max(80, "Máximo 80 caracteres"),
  titulo: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  tipo,
  operacion,
  zona: z.string().trim().max(120).optional().or(z.literal("")),
  direccion: z.string().trim().max(300).optional().or(z.literal("")),
  precio: z.string().trim().optional().or(z.literal("")),
  moneda: z
    .string()
    .trim()
    .length(3, "Usa el código ISO de 3 letras (ej. PEN)")
    .or(z.literal("")),
  estadoInmueble,
  notas: z.string().trim().max(5000).optional().or(z.literal("")),
});

export type InmuebleFormValues = z.infer<typeof inmuebleFormSchema>;

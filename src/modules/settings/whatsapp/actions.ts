"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function linkWhatsappNumeroAction(
  wabaId: string,
  phoneNumberId: string,
  numeroDisplay?: string,
  nombreVerificado?: string,
): Promise<void> {
  try {
    await apiFetch("/whatsapp/connections", {
      method: "POST",
      body: JSON.stringify({ wabaId, phoneNumberId, numeroDisplay, nombreVerificado }),
    });
  } catch (error) {
    fail(error, "No se pudo vincular el número de WhatsApp");
  }
}

export async function unlinkWhatsappNumeroAction(id: string): Promise<void> {
  try {
    await apiFetch(`/whatsapp/connections/${id}`, { method: "DELETE" });
  } catch (error) {
    fail(error, "No se pudo desvincular el número");
  }
}

export interface CrearPlantillaInput {
  nombre: string;
  categoria: "AUTHENTICATION" | "MARKETING" | "UTILITY";
  idioma: string;
  cuerpo: string;
  ejemplosCuerpo?: string[];
  encabezado?: string;
  ejemploEncabezado?: string;
  pie?: string;
}

export async function crearPlantillaWhatsAppAction(input: CrearPlantillaInput): Promise<void> {
  try {
    await apiFetch("/whatsapp/chats/templates", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    fail(error, "No se pudo crear la plantilla");
  }
}

"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function enviarMensajeAction(
  conversacionId: string,
  input: {
    texto?: string;
    plantillaNombre?: string;
    plantillaIdioma?: string;
    parametros?: { nombre: string; valor: string }[];
    plantillaFormatoParametros?: string;
  },
): Promise<void> {
  try {
    await apiFetch(`/whatsapp/chats/${conversacionId}/messages`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    fail(error, "No se pudo enviar el mensaje");
  }
}

/** Sube y envía un archivo — timeout más alto que el default (documentos
 * grandes, hasta 100MB según Meta, pueden tardar en subir con conexiones lentas). */
export async function enviarMediaAction(conversacionId: string, formData: FormData): Promise<void> {
  try {
    await apiFetch(`/whatsapp/chats/${conversacionId}/media`, {
      method: "POST",
      body: formData,
      timeoutMs: 120_000,
    });
  } catch (error) {
    fail(error, "No se pudo enviar el archivo");
  }
}

export async function iniciarChatDesdeLeadAction(leadId: string): Promise<{ conversacionId: string }> {
  try {
    return await apiFetch<{ conversacionId: string }>(`/whatsapp/chats/start-from-lead/${leadId}`, {
      method: "POST",
    });
  } catch (error) {
    fail(error, "No se pudo iniciar el chat");
  }
}

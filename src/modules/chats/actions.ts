"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function enviarMensajeAction(
  conversacionId: string,
  input: { texto?: string; plantillaNombre?: string; plantillaIdioma?: string },
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

export async function iniciarChatDesdeLeadAction(leadId: string): Promise<{ conversacionId: string }> {
  try {
    return await apiFetch<{ conversacionId: string }>(`/whatsapp/chats/start-from-lead/${leadId}`, {
      method: "POST",
    });
  } catch (error) {
    fail(error, "No se pudo iniciar el chat");
  }
}

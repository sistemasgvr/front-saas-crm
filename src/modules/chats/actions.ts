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
    /** Id propio del mensaje al que se responde — "Responder" del chat. */
    respondeAMensajeId?: string;
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

/** emoji vacío ("") saca la reacción que ya estuviera puesta — mismo endpoint para poner y sacar. */
export async function enviarReaccionAction(conversacionId: string, mensajeId: string, emoji: string): Promise<void> {
  try {
    await apiFetch(`/whatsapp/chats/${conversacionId}/messages/${mensajeId}/reaction`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    });
  } catch (error) {
    fail(error, "No se pudo reaccionar al mensaje");
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

export async function enviarUbicacionAction(
  conversacionId: string,
  input: {
    latitud: number;
    longitud: number;
    nombre?: string;
    direccion?: string;
    respondeAMensajeId?: string;
  },
): Promise<void> {
  try {
    await apiFetch(`/whatsapp/chats/${conversacionId}/location`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    fail(error, "No se pudo enviar la ubicación");
  }
}

export async function enviarContactoAction(
  conversacionId: string,
  input: {
    contactos: { nombre: string; telefonos: { numero: string; tipo?: string }[]; organizacion?: string }[];
    respondeAMensajeId?: string;
  },
): Promise<void> {
  try {
    await apiFetch(`/whatsapp/chats/${conversacionId}/contact`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    fail(error, "No se pudo enviar el contacto");
  }
}

export async function enviarInteractivoAction(
  conversacionId: string,
  input: {
    subtipo: "button" | "list" | "cta_url" | "location_request";
    cuerpo: string;
    pie?: string;
    botones?: { id: string; titulo: string }[];
    botonLista?: string;
    secciones?: { titulo?: string; filas: { id: string; titulo: string; descripcion?: string }[] }[];
    textoBoton?: string;
    url?: string;
    respondeAMensajeId?: string;
  },
): Promise<void> {
  try {
    await apiFetch(`/whatsapp/chats/${conversacionId}/interactive`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    fail(error, "No se pudo enviar el mensaje interactivo");
  }
}

/** Le pide a Meta mostrar "escribiendo…" en el WhatsApp del contacto (y de
 * paso confirma la lectura del último mensaje suyo) — pensado para llamarse
 * mientras el usuario escribe, con throttle en quien llama, no en cada tecla. */
export async function notificarEscribiendoAction(conversacionId: string): Promise<void> {
  try {
    await apiFetch(`/whatsapp/chats/${conversacionId}/typing`, { method: "POST" });
  } catch (error) {
    fail(error, "No se pudo notificar que estás escribiendo");
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

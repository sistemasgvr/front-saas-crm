"use server";

import { apiFetch, ApiError } from "@/src/lib/api";
import type {
  MotivoPostLlamada,
  PresenciaLlamadas,
  RolLineaWhatsapp,
  WhatsappLlamada,
} from "./types";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function setPresenciaAction(disponible: boolean): Promise<PresenciaLlamadas> {
  try {
    return await apiFetch<PresenciaLlamadas>("/whatsapp/calls/presencia", {
      method: "PUT",
      body: JSON.stringify({ disponible }),
    });
  } catch (error) {
    fail(error, "No se pudo actualizar la presencia de llamadas");
  }
}

export async function preAcceptLlamadaAction(
  callId: string,
  sdp: string,
): Promise<WhatsappLlamada> {
  try {
    return await apiFetch<WhatsappLlamada>(`/whatsapp/calls/${callId}/pre-accept`, {
      method: "POST",
      body: JSON.stringify({ sdp }),
    });
  } catch (error) {
    fail(error, "No se pudo pre-aceptar la llamada");
  }
}

export async function acceptLlamadaAction(
  callId: string,
  sdp: string,
): Promise<WhatsappLlamada> {
  try {
    return await apiFetch<WhatsappLlamada>(`/whatsapp/calls/${callId}/accept`, {
      method: "POST",
      body: JSON.stringify({ sdp }),
    });
  } catch (error) {
    fail(error, "No se pudo aceptar la llamada");
  }
}

export async function rejectLlamadaAction(callId: string): Promise<WhatsappLlamada> {
  try {
    return await apiFetch<WhatsappLlamada>(`/whatsapp/calls/${callId}/reject`, {
      method: "POST",
    });
  } catch (error) {
    fail(error, "No se pudo rechazar la llamada");
  }
}

export async function terminateLlamadaAction(callId: string): Promise<WhatsappLlamada> {
  try {
    return await apiFetch<WhatsappLlamada>(`/whatsapp/calls/${callId}/terminate`, {
      method: "POST",
    });
  } catch (error) {
    fail(error, "No se pudo colgar la llamada");
  }
}

export async function iniciarLlamadaSalienteAction(input: {
  conversacionId?: string;
  waId?: string;
  sdp: string;
}): Promise<WhatsappLlamada> {
  try {
    return await apiFetch<WhatsappLlamada>("/whatsapp/calls/saliente", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    fail(error, "No se pudo iniciar la llamada saliente");
  }
}

export async function solicitarPermisoLlamadaAction(input: {
  conversacionId?: string;
  waId?: string;
  mensaje?: string;
  plantillaNombre?: string;
  plantillaIdioma?: string;
}): Promise<{ success: true }> {
  try {
    return await apiFetch<{ success: true }>("/whatsapp/calls/permiso", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    fail(error, "No se pudo solicitar el permiso de llamada");
  }
}

export async function actualizarLlamadaAction(
  id: string,
  input: { notaPostLlamada?: string; motivo?: MotivoPostLlamada | string },
): Promise<WhatsappLlamada> {
  try {
    return await apiFetch<WhatsappLlamada>(`/whatsapp/calls/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  } catch (error) {
    fail(error, "No se pudo guardar la nota de la llamada");
  }
}

export async function actualizarSettingsLlamadaAction(input: {
  conexionId: string;
  status?: string;
  callIconVisibility?: string;
  callHours?: unknown;
  callbackPermissionStatus?: string;
}): Promise<{ ok: true }> {
  try {
    return await apiFetch<{ ok: true }>("/whatsapp/calls/settings", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  } catch (error) {
    fail(error, "No se pudieron actualizar los ajustes de llamadas");
  }
}

export async function actualizarRolLineaAction(
  conexionId: string,
  rolLinea: RolLineaWhatsapp,
): Promise<void> {
  try {
    await apiFetch(`/whatsapp/connections/${conexionId}`, {
      method: "PATCH",
      body: JSON.stringify({ rolLinea }),
    });
  } catch (error) {
    fail(error, "No se pudo actualizar el rol de la línea");
  }
}

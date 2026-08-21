"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function tomarLeadAction(id: string): Promise<void> {
  try {
    await apiFetch(`/leads/${id}/claim`, { method: "POST" });
  } catch (error) {
    fail(error, "No se pudo tomar el lead");
  }
}

export async function asignarLeadAction(id: string, usuarioId: string): Promise<void> {
  try {
    await apiFetch(`/leads/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ usuarioId }),
    });
  } catch (error) {
    fail(error, "No se pudo asignar el lead");
  }
}

export async function liberarLeadAction(id: string): Promise<void> {
  try {
    await apiFetch(`/leads/${id}/release`, { method: "POST" });
  } catch (error) {
    fail(error, "No se pudo liberar el lead");
  }
}

export async function actualizarTipoLeadAction(id: string, tipoLead: string): Promise<void> {
  try {
    await apiFetch(`/leads/${id}/gestion`, {
      method: "PATCH",
      body: JSON.stringify({ tipoLead }),
    });
  } catch (error) {
    fail(error, "No se pudo guardar el tipo de lead");
  }
}

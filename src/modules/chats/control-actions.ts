"use server";
import type { PaginatedResult } from "@/src/lib/pagination";
import { apiFetch, ApiError } from "@/src/lib/api";
import type {
  EstadoControl,
  EventoControl,
  PersonaControl,
  ResultadoControl,
} from "./control-types";

async function resultado<T>(
  path: string,
  init?: RequestInit,
): Promise<ResultadoControl<T>> {
  try {
    return { ok: true, data: await apiFetch<T>(path, init) };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "No se pudo actualizar el control",
      status: e instanceof ApiError ? e.status : 0,
    };
  }
}
export async function getControlAction(id: string) {
  return resultado<EstadoControl>(`/whatsapp/chats/${id}/control`);
}
export async function getHistorialControlAction(id: string, page = 1) {
  return resultado<PaginatedResult<EventoControl>>(`/whatsapp/chats/${id}/control/historial?page=${page}&pageSize=20`);
}
export async function getAsesoresControlAction(id: string) {
  return resultado<(PersonaControl & { rol: string })[]>(
    `/whatsapp/chats/${id}/control/asesores`,
  );
}
export async function tomarControlAction(id: string, controlVersion: number) {
  return resultado<EstadoControl>(`/whatsapp/chats/${id}/control/tomar`, {
    method: "POST",
    body: JSON.stringify({ controlVersion }),
  });
}
export async function asumirHumanoAction(
  id: string,
  controlVersion: number,
  asignadoUsuarioId: string | null,
) {
  return resultado<EstadoControl>(
    `/whatsapp/chats/${id}/control/asumir-humano`,
    {
      method: "POST",
      body: JSON.stringify({ controlVersion, asignadoUsuarioId }),
    },
  );
}
export async function asignarBotAction(id: string, controlVersion: number) {
  return resultado<EstadoControl>(`/whatsapp/chats/${id}/control/asignar-bot`, {
    method: "POST",
    body: JSON.stringify({ controlVersion }),
  });
}
export async function transferirControlAction(
  id: string,
  controlVersion: number,
  usuarioId: string,
) {
  return resultado<EstadoControl>(`/whatsapp/chats/${id}/control/transferir`, {
    method: "POST",
    body: JSON.stringify({ controlVersion, usuarioId }),
  });
}

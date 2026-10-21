"use server";
import { apiFetch, ApiError } from "@/src/lib/api";
import type { ResultadoControl } from "@/src/modules/chats/control-types";
import type { BotOrganizacion, BotConfiguracionEvento } from "./bot-types";
async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ResultadoControl<T>> {
  try {
    return { ok: true, data: await apiFetch<T>(path, init) };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "No se pudo consultar la configuración del bot",
      status: e instanceof ApiError ? e.status : 0,
    };
  }
}
export async function getBotOrganizacion(id: string) {
  return request<BotOrganizacion>(`/admin/organizations/${id}/whatsapp-bot`);
}
export async function getBotHistorial(id: string) {
  return request<BotConfiguracionEvento[]>(
    `/admin/organizations/${id}/whatsapp-bot/historial`,
  );
}
export async function actualizarBotOrganizacion(
  id: string,
  habilitado: boolean,
  configVersion: number,
  motivo: string,
) {
  return request<BotOrganizacion>(`/admin/organizations/${id}/whatsapp-bot`, {
    method: "PATCH",
    body: JSON.stringify({ habilitado, configVersion, motivo }),
  });
}

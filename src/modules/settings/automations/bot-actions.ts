"use server";
import { apiFetch, ApiError } from "@/src/lib/api";
import type { ResultadoControl } from "@/src/modules/chats/control-types";
import type { BotPreferencias } from "./bot-types";
export async function getBotPreferencias(): Promise<
  ResultadoControl<BotPreferencias>
> {
  try {
    return {
      ok: true,
      data: await apiFetch<BotPreferencias>("/whatsapp/bot/preferencias"),
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "No se pudo consultar la atención",
      status: e instanceof ApiError ? e.status : 0,
    };
  }
}
export async function guardarBotPreferencias(
  modoInicial: "HUMANO" | "BOT",
  preferenciasVersion: number,
): Promise<ResultadoControl<BotPreferencias>> {
  try {
    return {
      ok: true,
      data: await apiFetch<BotPreferencias>("/whatsapp/bot/preferencias", {
        method: "PATCH",
        body: JSON.stringify({ modoInicial, preferenciasVersion }),
      }),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo guardar la atención",
      status: e instanceof ApiError ? e.status : 0,
    };
  }
}

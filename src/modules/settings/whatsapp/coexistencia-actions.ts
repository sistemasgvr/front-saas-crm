"use server";
import { apiFetch } from "@/src/lib/api";
import { runAction } from "@/src/lib/server-action";

export async function coexistenciaConfig() {
  return runAction(() => apiFetch<{ appId: string; configId: string | null; version: string }>("/whatsapp/coexistencia/config"));
}
export async function guardarCoexistenciaConfig(appId: string, configId: string | null) {
  return runAction(() => apiFetch<{ configId: string | null }>("/whatsapp/coexistencia/config", {
    method: "PATCH", body: JSON.stringify({ appId, configId }),
  }));
}
export async function coexistenciaCode(code: string, redirectUri: string) {
  return runAction(() => apiFetch<{ sessionId: string }>("/whatsapp/coexistencia/code", { method: "POST", body: JSON.stringify({ code, redirectUri }), timeoutMs: 30000 }));
}
export async function coexistenciaComplete(sessionId: string, wabaId: string, phoneNumberId?: string) {
  return runAction(() => apiFetch<{ ok: boolean; phoneNumberId: string }>("/whatsapp/coexistencia/complete", {
    method: "POST", body: JSON.stringify({ sessionId, wabaId, phoneNumberId }), timeoutMs: 90000,
  }));
}

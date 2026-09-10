"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function markNotificationReadAction(id: string): Promise<void> {
  try {
    await apiFetch(`/notifications/${id}/read`, { method: "POST" });
  } catch (error) {
    fail(error, "No se pudo marcar como leída");
  }
}

export async function markAllNotificationsReadAction(): Promise<void> {
  try {
    await apiFetch("/notifications/read-all", { method: "POST" });
  } catch (error) {
    fail(error, "No se pudieron marcar como leídas");
  }
}

export async function subscribePushAction(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}): Promise<void> {
  try {
    await apiFetch("/notifications/push/subscribe", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    fail(error, "No se pudo registrar el dispositivo para notificaciones push");
  }
}

export async function unsubscribePushAction(endpoint: string): Promise<void> {
  try {
    await apiFetch("/notifications/push/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    });
  } catch (error) {
    fail(error, "No se pudo desactivar las notificaciones push");
  }
}

/** Diagnóstico: solo Web Push al dispositivo actual (sin historial ni socket). */
export async function testPushAction(): Promise<{
  enabled: boolean;
  attempted: number;
  delivered: number;
  failed: number;
}> {
  try {
    return await apiFetch<{
      enabled: boolean;
      attempted: number;
      delivered: number;
      failed: number;
    }>("/notifications/push/test", {
      method: "POST",
    });
  } catch (error) {
    fail(error, "No se pudo enviar el push de prueba");
  }
}

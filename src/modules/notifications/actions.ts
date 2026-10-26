"use server";

import { apiFetch, ApiError } from "@/src/lib/api";
import { runAction } from "@/src/lib/server-action";
import type { ActionResult } from "@/src/lib/action-result";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function markNotificationReadAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
    } catch (error) {
      fail(error, "No se pudo marcar como leída");
    }
  });
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<void>> {
  return runAction(async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "POST" });
    } catch (error) {
      fail(error, "No se pudieron marcar como leídas");
    }
  });
}

export async function markWhatsappNotificationsReadAction(
  conversacionId: string,
): Promise<ActionResult<{ count: number }>> {
  return runAction(async () => {
    try {
      return await apiFetch<{ count: number }>(
        `/notifications/read-whatsapp/${conversacionId}`,
        { method: "POST" },
      );
    } catch (error) {
      fail(error, "No se pudieron marcar las notificaciones de WhatsApp como leídas");
    }
  });
}

export async function subscribePushAction(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}): Promise<ActionResult<void>> {
  return runAction(async () => {
    try {
      await apiFetch("/notifications/push/subscribe", {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch (error) {
      fail(error, "No se pudo registrar el dispositivo para notificaciones push");
    }
  });
}

export async function unsubscribePushAction(endpoint: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    try {
      await apiFetch("/notifications/push/subscribe", {
        method: "DELETE",
        body: JSON.stringify({ endpoint }),
      });
    } catch (error) {
      fail(error, "No se pudo desactivar las notificaciones push");
    }
  });
}

/** Diagnóstico: solo Web Push al dispositivo actual (sin historial ni socket). */
export async function testPushAction(): Promise<ActionResult<{
  enabled: boolean;
  attempted: number;
  delivered: number;
  failed: number;
}>> {
  return runAction(async () => {
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
  });
}

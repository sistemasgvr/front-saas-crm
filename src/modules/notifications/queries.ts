"use server";

import { apiFetch } from "@/src/lib/api";
import type { ListaNotificacionesResultado } from "./types";

export async function getNotifications(page: number) {
  return apiFetch<ListaNotificacionesResultado>(`/notifications?page=${page}&pageSize=20`);
}

export async function getUnreadCount() {
  return apiFetch<{ count: number }>("/notifications/unread-count");
}

export async function getSocketTicket() {
  return apiFetch<{ ticket: string }>("/notifications/socket-ticket", { method: "POST" });
}

export async function getVapidPublicKey() {
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  try {
    const remote = await apiFetch<{ enabled: boolean; publicKey: string | null }>(
      "/notifications/push/vapid-public-key",
    );
    if (remote.enabled && remote.publicKey) return remote;
  } catch {
    // Si el API falla, usamos la clave pública del .env del front si existe.
  }
  if (fromEnv) return { enabled: true, publicKey: fromEnv };
  return { enabled: false, publicKey: null };
}

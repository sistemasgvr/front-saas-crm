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

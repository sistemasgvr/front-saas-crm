"use server";

import type { PaginatedResult } from "@/src/lib/pagination";
import { apiFetchCollection } from "@/src/lib/api-collection";
import { apiFetch } from "@/src/lib/api";
import type { ConversacionDetalle, ConversacionResumen, PlantillaWhatsApp } from "./types";

export async function getChats(
  asignado: "todos" | "mios" = "todos",
): Promise<ConversacionResumen[]> {
  const q = asignado === "mios" ? "?asignado=mios" : "?asignado=todos";
  const data = await apiFetchCollection<ConversacionResumen>(`/whatsapp/chats${q}`);
  return Array.isArray(data) ? data : [];
}

export async function getChatsUnreadCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>("/whatsapp/chats/unread-count");
}

export async function getChat(id: string): Promise<ConversacionDetalle> {
  return apiFetch<ConversacionDetalle>(`/whatsapp/chats/${id}`);
}

export async function getTemplates(): Promise<PlantillaWhatsApp[]> {
  const data = await apiFetch<PlantillaWhatsApp[]>("/whatsapp/chats/templates");
  return Array.isArray(data) ? data : [];
}

export async function getChatsPage(asignado: "todos" | "mios", page = 1, q = "", borradores = "") {
  const params = new URLSearchParams({ asignado, page: String(page), pageSize: "20", q, borradores });
  return apiFetch<PaginatedResult<ConversacionResumen>>(`/whatsapp/chats?${params}`);
}

export async function getMensajesAnteriores(id: string, before: string): Promise<ConversacionDetalle> {
  return apiFetch<ConversacionDetalle>(`/whatsapp/chats/${id}/messages?before=${encodeURIComponent(before)}`);
}

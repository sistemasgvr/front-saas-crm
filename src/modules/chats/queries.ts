"use server";

import { apiFetch } from "@/src/lib/api";
import type { ConversacionDetalle, ConversacionResumen, PlantillaWhatsApp } from "./types";

export async function getChats(
  asignado: "todos" | "mios" = "todos",
): Promise<ConversacionResumen[]> {
  const q = asignado === "mios" ? "?asignado=mios" : "?asignado=todos";
  const data = await apiFetch<ConversacionResumen[]>(`/whatsapp/chats${q}`);
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

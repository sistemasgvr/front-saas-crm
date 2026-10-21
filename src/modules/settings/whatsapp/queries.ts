"use server";

import type { PaginatedResult } from "@/src/lib/pagination";
import { apiFetchCollection } from "@/src/lib/api-collection";
import { apiFetch } from "@/src/lib/api";
import type { NumeroWhatsAppDisponible, PlantillaWhatsApp, WhatsappConexion } from "./types";

export async function getWhatsappConexiones(): Promise<WhatsappConexion[]> {
  const data = await apiFetchCollection<WhatsappConexion>("/whatsapp/connections");
  return Array.isArray(data) ? data : [];
}

export async function getWhatsappNumerosDisponibles(): Promise<NumeroWhatsAppDisponible[]> {
  const data = await apiFetchCollection<NumeroWhatsAppDisponible>("/whatsapp/connections/available");
  return Array.isArray(data) ? data : [];
}

export async function getPlantillasWhatsAppTodas(page = 1): Promise<PaginatedResult<PlantillaWhatsApp>> {
  const data = await apiFetch<PaginatedResult<PlantillaWhatsApp>>(`/whatsapp/chats/templates/all?page=${page}&pageSize=20`);
  return data;
}

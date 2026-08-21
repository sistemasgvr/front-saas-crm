"use server";

import { apiFetch } from "@/src/lib/api";
import type { NumeroWhatsAppDisponible, WhatsappConexion } from "./types";

export async function getWhatsappConexiones(): Promise<WhatsappConexion[]> {
  const data = await apiFetch<WhatsappConexion[]>("/whatsapp/connections");
  return Array.isArray(data) ? data : [];
}

export async function getWhatsappNumerosDisponibles(): Promise<NumeroWhatsAppDisponible[]> {
  const data = await apiFetch<NumeroWhatsAppDisponible[]>("/whatsapp/connections/available");
  return Array.isArray(data) ? data : [];
}

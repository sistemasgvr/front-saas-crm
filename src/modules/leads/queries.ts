"use server";

import { apiFetch } from "@/src/lib/api";
import type { FiltroLeads, LeadDetalle, ListaLeadsResultado } from "./types";
import type { ReferenciaNombrada } from "./types";

const PAGE_SIZE = 20;

export async function getLeads(filtro: FiltroLeads) {
  const params = new URLSearchParams();
  if (filtro.q) params.set("q", filtro.q);
  if (filtro.campanaId) params.set("campanaId", filtro.campanaId);
  if (filtro.anuncioId) params.set("anuncioId", filtro.anuncioId);
  if (filtro.formularioId) params.set("formularioId", filtro.formularioId);
  if (filtro.fechaDesde) params.set("fechaDesde", filtro.fechaDesde);
  if (filtro.fechaHasta) params.set("fechaHasta", filtro.fechaHasta);
  params.set("page", String(filtro.page));
  params.set("pageSize", String(PAGE_SIZE));
  return apiFetch<ListaLeadsResultado>(`/leads?${params.toString()}`);
}

export async function getLead(id: string) {
  return apiFetch<LeadDetalle>(`/leads/${id}`);
}

export async function getCampanasFiltro() {
  const data = await apiFetch<ReferenciaNombrada[]>("/meta/campaigns");
  return Array.isArray(data) ? data : [];
}

export async function getAnunciosFiltro() {
  const data = await apiFetch<ReferenciaNombrada[]>("/meta/ads");
  return Array.isArray(data) ? data : [];
}

"use server";

import { apiFetch } from "@/src/lib/api";
import type { FiltroLeads, LeadDetalle, ListaLeadsResultado } from "./types";
import type { ReferenciaNombrada } from "./types";

const PAGE_SIZE = 20;

export async function getLeads(filtro: FiltroLeads): Promise<ListaLeadsResultado> {
  const params = new URLSearchParams();
  if (filtro.q) params.set("q", filtro.q);
  if (filtro.campanaId) params.set("campanaId", filtro.campanaId);
  if (filtro.anuncioId) params.set("anuncioId", filtro.anuncioId);
  if (filtro.metaPaginaId) params.set("metaPaginaId", filtro.metaPaginaId);
  if (filtro.metaCuentaId) params.set("metaCuentaId", filtro.metaCuentaId);
  if (filtro.formularioId) params.set("formularioId", filtro.formularioId);
  if (filtro.fechaDesde) params.set("fechaDesde", filtro.fechaDesde);
  if (filtro.fechaHasta) params.set("fechaHasta", filtro.fechaHasta);
  params.set("page", String(filtro.page));
  params.set("pageSize", String(PAGE_SIZE));
  return apiFetch<ListaLeadsResultado>(`/leads?${params.toString()}`);
}

export async function getLead(id: string): Promise<LeadDetalle> {
  return apiFetch<LeadDetalle>(`/leads/${id}`);
}

export async function getCampanasFiltro(): Promise<ReferenciaNombrada[]> {
  const data = await apiFetch<ReferenciaNombrada[]>("/meta/campaigns");
  return Array.isArray(data) ? data : [];
}

export async function getAnunciosFiltro(): Promise<ReferenciaNombrada[]> {
  const data = await apiFetch<ReferenciaNombrada[]>("/meta/ads");
  return Array.isArray(data) ? data : [];
}

export async function getPaginasFiltro(): Promise<ReferenciaNombrada[]> {
  const data = await apiFetch<ReferenciaNombrada[]>("/meta/pages/filtro");
  return Array.isArray(data) ? data : [];
}

export async function getCuentasFiltro(): Promise<ReferenciaNombrada[]> {
  const data = await apiFetch<ReferenciaNombrada[]>("/meta/ad-accounts/filtro");
  return Array.isArray(data) ? data : [];
}

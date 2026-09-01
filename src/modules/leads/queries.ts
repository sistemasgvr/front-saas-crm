"use server";

import { apiFetch } from "@/src/lib/api";
import type {
  AnuncioFiltroOpcion,
  CampanaFiltroOpcion,
  ConjuntoAnuncioFiltroOpcion,
  FiltroLeads,
  HistorialEstadoRow,
  LeadDetalle,
  ListaLeadsResultado,
  MetaPipeline,
  ReferenciaNombrada,
  TableroResultado,
} from "./types";

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
  if (filtro.asignado) params.set("asignado", filtro.asignado);
  if (filtro.estadoGestion) params.set("estadoGestion", filtro.estadoGestion);
  if (filtro.tipoLead) params.set("tipoLead", filtro.tipoLead);
  params.set("page", String(filtro.page));
  params.set("pageSize", String(PAGE_SIZE));
  return apiFetch<ListaLeadsResultado>(`/leads?${params.toString()}`);
}

export async function getLead(id: string): Promise<LeadDetalle> {
  return apiFetch<LeadDetalle>(`/leads/${id}`);
}

export async function getHistorialLead(id: string): Promise<HistorialEstadoRow[]> {
  const data = await apiFetch<HistorialEstadoRow[]>(`/leads/${id}/historial-estados`);
  return Array.isArray(data) ? data : [];
}

export async function getMetaPipeline(tipoLead?: string | null): Promise<MetaPipeline> {
  const params = tipoLead ? `?tipoLead=${tipoLead}` : "";
  return apiFetch<MetaPipeline>(`/leads/pipeline/meta${params}`);
}

export async function getTablero(tipoLead?: string | null, asignado?: string): Promise<TableroResultado> {
  const params = new URLSearchParams();
  if (tipoLead) params.set("tipoLead", tipoLead);
  if (asignado) params.set("asignado", asignado);
  const qs = params.toString();
  return apiFetch<TableroResultado>(`/leads/pipeline/tablero${qs ? `?${qs}` : ""}`);
}

export async function getAsignables(): Promise<ReferenciaNombrada[]> {
  const data = await apiFetch<ReferenciaNombrada[]>("/leads/asignables");
  return Array.isArray(data) ? data : [];
}

export async function getCampanasFiltro(): Promise<CampanaFiltroOpcion[]> {
  const data = await apiFetch<CampanaFiltroOpcion[]>("/meta/campaigns");
  return Array.isArray(data) ? data : [];
}

export async function getAnunciosFiltro(): Promise<AnuncioFiltroOpcion[]> {
  const data = await apiFetch<AnuncioFiltroOpcion[]>("/meta/ads");
  return Array.isArray(data) ? data : [];
}

export async function getConjuntosAnunciosFiltro(): Promise<ConjuntoAnuncioFiltroOpcion[]> {
  const data = await apiFetch<ConjuntoAnuncioFiltroOpcion[]>("/meta/adsets");
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

export async function getFormulariosFiltro(metaPaginaId?: string): Promise<ReferenciaNombrada[]> {
  const params = metaPaginaId ? `?metaPaginaId=${metaPaginaId}` : "";
  const data = await apiFetch<ReferenciaNombrada[]>(`/meta/forms${params}`);
  return Array.isArray(data) ? data : [];
}

"use server";

import { apiFetch } from "@/src/lib/api";
import type { DashboardKpis, DashboardSeries, FiltroDashboard, KpisPublicitarios, SeriesPublicitarias } from "./types";
import type { ReferenciaNombrada } from "@/src/modules/leads/types";

function paramsDe(filtro: FiltroDashboard) {
  const params = new URLSearchParams();
  if (filtro.campanaId) params.set("campanaId", filtro.campanaId);
  if (filtro.conjuntoAnuncioId) params.set("conjuntoAnuncioId", filtro.conjuntoAnuncioId);
  if (filtro.anuncioId) params.set("anuncioId", filtro.anuncioId);
  if (filtro.metaCuentaId) params.set("metaCuentaId", filtro.metaCuentaId);
  return params;
}

export async function getDashboardKpis(filtro: FiltroDashboard) {
  return apiFetch<DashboardKpis>(`/dashboard/kpis?${paramsDe(filtro).toString()}`);
}

export async function getDashboardSeries(filtro: FiltroDashboard) {
  const params = paramsDe(filtro);
  if (filtro.fechaDesde) params.set("fechaDesde", filtro.fechaDesde);
  if (filtro.fechaHasta) params.set("fechaHasta", filtro.fechaHasta);
  return apiFetch<DashboardSeries>(`/dashboard/series?${params.toString()}`);
}

export async function getDashboardAdsKpis(filtro: FiltroDashboard) {
  const params = paramsDe(filtro);
  if (filtro.fechaDesde) params.set("fechaDesde", filtro.fechaDesde);
  if (filtro.fechaHasta) params.set("fechaHasta", filtro.fechaHasta);
  return apiFetch<KpisPublicitarios>(`/dashboard/ads-kpis?${params.toString()}`);
}

export async function getDashboardAdsSeries(filtro: FiltroDashboard) {
  const params = paramsDe(filtro);
  if (filtro.fechaDesde) params.set("fechaDesde", filtro.fechaDesde);
  if (filtro.fechaHasta) params.set("fechaHasta", filtro.fechaHasta);
  return apiFetch<SeriesPublicitarias>(`/dashboard/ads-series?${params.toString()}`);
}

export async function getConjuntosAnunciosFiltro() {
  const data = await apiFetch<ReferenciaNombrada[]>("/meta/adsets");
  return Array.isArray(data) ? data : [];
}

export async function getCuentasFiltro() {
  const data = await apiFetch<ReferenciaNombrada[]>("/meta/ad-accounts/filtro");
  return Array.isArray(data) ? data : [];
}

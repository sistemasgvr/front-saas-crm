"use server";

import { apiFetch } from "@/src/lib/api";
import type {
  DashboardKpis,
  DashboardSeries,
  EmbudoKpis,
  FiltroDashboard,
  KpisPublicitarios,
  SeriesPublicitarias,
} from "./types";

function paramsMeta(filtro: FiltroDashboard) {
  const params = new URLSearchParams();
  if (filtro.campanaId) params.set("campanaId", filtro.campanaId);
  if (filtro.conjuntoAnuncioId) params.set("conjuntoAnuncioId", filtro.conjuntoAnuncioId);
  if (filtro.anuncioId) params.set("anuncioId", filtro.anuncioId);
  if (filtro.metaCuentaId) params.set("metaCuentaId", filtro.metaCuentaId);
  if (filtro.inmuebleId) params.set("inmuebleId", filtro.inmuebleId);
  return params;
}

function paramsRango(filtro: FiltroDashboard) {
  const params = paramsMeta(filtro);
  if (filtro.fechaDesde) params.set("fechaDesde", filtro.fechaDesde);
  if (filtro.fechaHasta) params.set("fechaHasta", filtro.fechaHasta);
  return params;
}

export async function getDashboardKpis(filtro: FiltroDashboard) {
  return apiFetch<DashboardKpis>(`/dashboard/kpis?${paramsMeta(filtro).toString()}`);
}

export async function getDashboardSeries(filtro: FiltroDashboard) {
  return apiFetch<DashboardSeries>(`/dashboard/series?${paramsRango(filtro).toString()}`);
}

export async function getDashboardAdsKpis(filtro: FiltroDashboard) {
  return apiFetch<KpisPublicitarios>(`/dashboard/ads-kpis?${paramsRango(filtro).toString()}`);
}

export async function getDashboardAdsSeries(filtro: FiltroDashboard) {
  return apiFetch<SeriesPublicitarias>(`/dashboard/ads-series?${paramsRango(filtro).toString()}`);
}

export async function getDashboardEmbudoKpis(filtro: FiltroDashboard) {
  const params = paramsRango(filtro);
  if (filtro.tipoLead) params.set("tipoLead", filtro.tipoLead);
  if (filtro.asignado) params.set("asignado", filtro.asignado);
  return apiFetch<EmbudoKpis>(`/dashboard/embudo-kpis?${params.toString()}`);
}

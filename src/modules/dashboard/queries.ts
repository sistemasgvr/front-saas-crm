"use server";

import { apiFetch } from "@/src/lib/api";
import type { DashboardKpis, DashboardSeries, FiltroDashboard } from "./types";
import type { ReferenciaNombrada } from "@/src/modules/leads/types";

function paramsDe(filtro: FiltroDashboard) {
  const params = new URLSearchParams();
  if (filtro.campanaId) params.set("campanaId", filtro.campanaId);
  if (filtro.conjuntoAnuncioId) params.set("conjuntoAnuncioId", filtro.conjuntoAnuncioId);
  if (filtro.anuncioId) params.set("anuncioId", filtro.anuncioId);
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

export async function getConjuntosAnunciosFiltro() {
  const data = await apiFetch<ReferenciaNombrada[]>("/meta/adsets");
  return Array.isArray(data) ? data : [];
}

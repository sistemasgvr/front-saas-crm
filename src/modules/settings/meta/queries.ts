"use server";

import { apiFetch, ApiError } from "@/src/lib/api";
import type {
  ListaMetaCuentasResultado,
  ListaMetaPaginasResultado,
  MetaConnection,
  MetaCuentaPublicitariaPerfil,
  MetaFormulario,
  MetaOption,
  MetaPaginaPerfil,
  SaludPermisosMeta,
} from "./types";

export async function getMetaConnection() {
  return apiFetch<MetaConnection>("/meta/connections/current");
}

export type ResultadoPermisos = { ok: true; data: SaludPermisosMeta } | { ok: false; message: string };

/** Devuelve un resultado envuelto en vez de lanzar: un Server Action llamado
 * directo desde queryFn (sin <form>) que lanza por una falla real de Graph (no
 * de auth) no propaga correctamente el error al estado isError de useQuery en
 * esta versión de Next.js — se evita por completo capturando acá. */
export async function getMetaPermissions(): Promise<ResultadoPermisos> {
  try {
    const data = await apiFetch<SaludPermisosMeta>("/meta/connections/permissions");
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof ApiError ? error.message : "No se pudieron verificar los permisos",
    };
  }
}

export async function getMetaPagesVinculadas(page: number) {
  return apiFetch<ListaMetaPaginasResultado>(`/meta/pages?page=${page}&pageSize=20`);
}

export async function getMetaPagesAvailable() {
  const data = await apiFetch<MetaOption[]>("/meta/pages/available");
  return Array.isArray(data) ? data : [];
}

export async function getMetaPageProfile(id: string) {
  return apiFetch<MetaPaginaPerfil>(`/meta/pages/${id}`);
}

export async function getMetaAdAccountsVinculadas(page: number) {
  return apiFetch<ListaMetaCuentasResultado>(`/meta/ad-accounts?page=${page}&pageSize=20`);
}

export async function getMetaAdAccountsAvailable() {
  const data = await apiFetch<MetaOption[]>("/meta/ad-accounts/available");
  return Array.isArray(data) ? data : [];
}

export async function getMetaAdAccountProfile(id: string) {
  return apiFetch<MetaCuentaPublicitariaPerfil>(`/meta/ad-accounts/${id}`);
}

export async function getMetaPageForms(pageId: string) {
  const data = await apiFetch<MetaFormulario[]>(`/meta/pages/${pageId}/forms`);
  return Array.isArray(data) ? data : [];
}

/** Totales reales en Meta por formId (POST Graph; usado al cargar y tras reimportar). */
export async function getMetaPageFormMetaCounts(pageId: string) {
  return apiFetch<Record<string, number>>(`/meta/pages/${pageId}/forms/meta-counts`, {
    method: "POST",
  });
}

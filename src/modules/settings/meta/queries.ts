"use server";

import { apiFetch } from "@/src/lib/api";
import type {
  ListaMetaCuentasResultado,
  ListaMetaPaginasResultado,
  MetaConnection,
  MetaCuentaPublicitariaPerfil,
  MetaFormulario,
  MetaOption,
  MetaPaginaPerfil,
} from "./types";

export async function getMetaConnection() {
  return apiFetch<MetaConnection>("/meta/connections/current");
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

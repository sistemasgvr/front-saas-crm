"use server";

import { apiFetch } from "@/src/lib/api";
import type { FiltroAdminOrganizaciones, ListaOrganizacionesResultado, ModuloMatriz, OrganizacionAdmin } from "../types";

function toSearch(params?: FiltroAdminOrganizaciones) {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? 1));
  search.set("pageSize", String(params?.pageSize ?? 20));
  if (params?.q) search.set("q", params.q);
  if (params?.estado !== undefined) search.set("estado", String(params.estado));
  return search.toString();
}

export async function getAdminOrganizations(params?: FiltroAdminOrganizaciones) {
  return apiFetch<ListaOrganizacionesResultado>(`/admin/organizations?${toSearch(params)}`);
}

export async function getAdminOrganization(id: string) {
  return apiFetch<OrganizacionAdmin>(`/admin/organizations/${id}`);
}

export async function getAdminOrganizationModules(id: string) {
  return apiFetch<ModuloMatriz[]>(`/admin/organizations/${id}/modules`);
}

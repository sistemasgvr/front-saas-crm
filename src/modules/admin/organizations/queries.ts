"use server";

import { apiFetch } from "@/src/lib/api";
import type { ListaOrganizacionesResultado, ModuloMatriz, OrganizacionAdmin } from "../types";

export async function getAdminOrganizations(params?: { page?: number; pageSize?: number }) {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? 1));
  search.set("pageSize", String(params?.pageSize ?? 20));
  return apiFetch<ListaOrganizacionesResultado>(`/admin/organizations?${search.toString()}`);
}

export async function getAdminOrganization(id: string) {
  return apiFetch<OrganizacionAdmin>(`/admin/organizations/${id}`);
}

export async function getAdminOrganizationModules(id: string) {
  return apiFetch<ModuloMatriz[]>(`/admin/organizations/${id}/modules`);
}

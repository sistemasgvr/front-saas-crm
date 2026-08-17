"use server";

import { apiFetch } from "@/src/lib/api";
import type { ModuloMatriz, OrganizacionAdmin } from "../types";

export async function getAdminOrganizations() {
  const data = await apiFetch<OrganizacionAdmin[]>("/admin/organizations");
  return Array.isArray(data) ? data : [];
}

export async function getAdminOrganization(id: string) {
  return apiFetch<OrganizacionAdmin>(`/admin/organizations/${id}`);
}

export async function getAdminOrganizationModules(id: string) {
  return apiFetch<ModuloMatriz[]>(`/admin/organizations/${id}/modules`);
}

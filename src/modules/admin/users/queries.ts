"use server";

import { apiFetch } from "@/src/lib/api";
import type { UsuarioAdmin, UsuarioAdminDetalle } from "../types";

export async function getAdminUsers() {
  const data = await apiFetch<UsuarioAdmin[]>("/admin/users");
  return Array.isArray(data) ? data : [];
}

export async function getAdminUser(id: string) {
  const user = await apiFetch<UsuarioAdminDetalle>(`/admin/users/${id}`);
  return {
    ...user,
    organizaciones: Array.isArray(user?.organizaciones) ? user.organizaciones : [],
  };
}

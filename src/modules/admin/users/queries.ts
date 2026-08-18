"use server";

import { apiFetch } from "@/src/lib/api";
import type { ListaUsuariosResultado, UsuarioAdminDetalle } from "../types";

export async function getAdminUsers(params?: { page?: number; pageSize?: number }) {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? 1));
  search.set("pageSize", String(params?.pageSize ?? 20));
  return apiFetch<ListaUsuariosResultado>(`/admin/users?${search.toString()}`);
}

export async function getAdminUser(id: string) {
  const user = await apiFetch<UsuarioAdminDetalle>(`/admin/users/${id}`);
  return {
    ...user,
    organizaciones: Array.isArray(user?.organizaciones) ? user.organizaciones : [],
  };
}

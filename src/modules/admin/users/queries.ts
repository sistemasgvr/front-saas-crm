"use server";

import { apiFetch } from "@/src/lib/api";
import type { FiltroAdminUsuarios, ListaUsuariosResultado, UsuarioAdminDetalle } from "../types";

function toSearch(params?: FiltroAdminUsuarios) {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? 1));
  search.set("pageSize", String(params?.pageSize ?? 20));
  if (params?.q) search.set("q", params.q);
  if (params?.estado !== undefined) search.set("estado", String(params.estado));
  if (params?.esAdminPlataforma !== undefined) search.set("esAdminPlataforma", String(params.esAdminPlataforma));
  return search.toString();
}

export async function getAdminUsers(params?: FiltroAdminUsuarios) {
  return apiFetch<ListaUsuariosResultado>(`/admin/users?${toSearch(params)}`);
}

export async function getAdminUser(id: string) {
  const user = await apiFetch<UsuarioAdminDetalle>(`/admin/users/${id}`);
  return {
    ...user,
    organizaciones: Array.isArray(user?.organizaciones) ? user.organizaciones : [],
  };
}

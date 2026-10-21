"use server";
import { apiFetchCollection } from "@/src/lib/api-collection";
import type { UsuarioEmpresa } from "./types";
import { apiFetch, ApiError } from "@/src/lib/api";
import type { UsuariosEmpresaResponse } from "./types";

export async function getUsuariosEmpresa(params: { page?: number; q?: string; rol?: string; estado?: string } = {}) {
  const search = new URLSearchParams({ page: String(params.page ?? 1), pageSize: "20" });
  for (const key of ["q", "rol", "estado"] as const) {
    if (params[key]) search.set(key, params[key]);
  }
  return apiFetch<UsuariosEmpresaResponse>(`/organizations/current/users?${search}`);
}
export async function guardarUsuarioEmpresa(
  id: string | null,
  datos: {
    nombre: string;
    apellido: string;
    telefono: string;
    rol: string;
    email?: string;
    password?: string;
  },
) {
  try {
    await apiFetch(
      `/organizations/current/users${id ? `/${encodeURIComponent(id)}` : ""}`,
      { method: id ? "PATCH" : "POST", body: JSON.stringify(datos) },
    );
  } catch (e) {
    throw new Error(
      e instanceof ApiError ? e.message : "No se pudo guardar el usuario",
    );
  }
}
export async function estadoUsuarioEmpresa(id: string, estado: 0 | 1) {
  try {
    return await apiFetch<{ leadsAsignados?: number }>(
      `/organizations/current/users/${encodeURIComponent(id)}/estado`,
      { method: "PATCH", body: JSON.stringify({ estado }) },
    );
  } catch (e) {
    throw new Error(
      e instanceof ApiError ? e.message : "No se pudo cambiar el estado",
    );
  }
}
export async function passwordTemporalEmpresa(id: string, password: string) {
  try {
    await apiFetch(
      `/organizations/current/users/${encodeURIComponent(id)}/password-temporal`,
      { method: "POST", body: JSON.stringify({ password }) },
    );
  } catch (e) {
    throw new Error(
      e instanceof ApiError
        ? e.message
        : "No se pudo restablecer la contraseña",
    );
  }
}
export async function reasignarLeadsUsuario(
  id: string,
  destinoUsuarioId: string,
) {
  try {
    return await apiFetch<{ reasignados: number }>(
      `/organizations/current/users/${encodeURIComponent(id)}/reasignar-leads`,
      { method: "POST", body: JSON.stringify({ destinoUsuarioId }) },
    );
  } catch (e) {
    throw new Error(
      e instanceof ApiError ? e.message : "No se pudieron reasignar los leads",
    );
  }
}

export async function getUsuariosEmpresaDestinos() {
  return apiFetchCollection<UsuarioEmpresa>("/organizations/current/users?estado=activo");
}

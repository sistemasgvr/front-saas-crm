"use server";
import { apiFetch, ApiError } from "@/src/lib/api";
import { runAction } from "@/src/lib/server-action";
import type { DatosRol, GrupoPermisos, RolEmpresa } from "./types";

const base = "/organizations/current/roles";

function mensaje(e: unknown, defecto: string) {
  return new Error(e instanceof ApiError ? e.message : defecto);
}

export async function getRolesEmpresa() {
  return runAction(async () => apiFetch<RolEmpresa[]>(base));
}

export async function getCatalogoPermisos() {
  return runAction(async () => apiFetch<GrupoPermisos[]>(`${base}/catalogo`));
}

export async function guardarRolEmpresa(id: string | null, datos: DatosRol) {
  return runAction(async () => {
    try {
      return await apiFetch<{ id: string }>(
        id ? `${base}/${encodeURIComponent(id)}` : base,
        { method: id ? "PATCH" : "POST", body: JSON.stringify(datos) },
      );
    } catch (e) {
      throw mensaje(e, "No se pudo guardar el rol");
    }
  });
}

export async function restaurarRolEmpresa(id: string) {
  return runAction(async () => {
    try {
      return await apiFetch<{ id: string }>(
        `${base}/${encodeURIComponent(id)}/restaurar`,
        { method: "POST" },
      );
    } catch (e) {
      throw mensaje(e, "No se pudo restaurar el rol");
    }
  });
}

export async function desactivarRolEmpresa(id: string) {
  return runAction(async () => {
    try {
      return await apiFetch<{ id: string }>(
        `${base}/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
    } catch (e) {
      throw mensaje(e, "No se pudo eliminar el rol");
    }
  });
}

"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function emptyToUndefined(value: string) {
  return value.trim() === "" ? undefined : value.trim();
}

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function createModuleAction(formData: FormData) {
  try {
    await apiFetch("/admin/modules", {
      method: "POST",
      body: JSON.stringify({
        codigo: String(formData.get("codigo") ?? "").trim(),
        nombre: String(formData.get("nombre") ?? "").trim(),
        descripcion: emptyToUndefined(String(formData.get("descripcion") ?? "")),
        icono: emptyToUndefined(String(formData.get("icono") ?? "")),
        orden: Number(formData.get("orden") ?? 0),
      }),
    });
  } catch (error) {
    fail(error, "No se pudo crear el módulo");
  }
}

export async function updateModuleAction(id: string, formData: FormData) {
  try {
    await apiFetch(`/admin/modules/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        nombre: String(formData.get("nombre") ?? "").trim(),
        descripcion: emptyToUndefined(String(formData.get("descripcion") ?? "")),
        icono: emptyToUndefined(String(formData.get("icono") ?? "")),
        orden: Number(formData.get("orden") ?? 0),
      }),
    });
  } catch (error) {
    fail(error, "No se pudo guardar");
  }
}

export async function toggleModuleStatusAction(id: string, estado: 0 | 1) {
  try {
    await apiFetch(`/admin/modules/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  } catch (error) {
    fail(error, "No se pudo actualizar el módulo");
  }
}

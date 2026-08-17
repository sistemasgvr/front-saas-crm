"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function emptyToUndefined(value: string) {
  return value.trim() === "" ? undefined : value.trim();
}

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function createUserAction(formData: FormData) {
  const organizacionId = String(formData.get("organizacionId") ?? "").trim();
  const rol = String(formData.get("rol") ?? "").trim();
  try {
    await apiFetch("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: String(formData.get("email") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
        nombre: String(formData.get("nombre") ?? "").trim(),
        apellido: emptyToUndefined(String(formData.get("apellido") ?? "")),
        telefono: emptyToUndefined(String(formData.get("telefono") ?? "")),
        esAdminPlataforma: formData.get("esAdminPlataforma") === "on",
        asignacion: organizacionId && rol ? { organizacionId, rol } : undefined,
      }),
    });
  } catch (error) {
    fail(error, "No se pudo crear el usuario");
  }
}

export async function toggleUserStatusAction(id: string, estado: 0 | 1) {
  try {
    await apiFetch(`/admin/users/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  } catch (error) {
    fail(error, "No se pudo actualizar el estado");
  }
}

export async function assignUserOrgAction(userId: string, formData: FormData) {
  try {
    await apiFetch(`/admin/users/${userId}/organizaciones`, {
      method: "POST",
      body: JSON.stringify({
        organizacionId: String(formData.get("organizacionId") ?? ""),
        rol: String(formData.get("rol") ?? ""),
      }),
    });
  } catch (error) {
    fail(error, "No se pudo asignar");
  }
}

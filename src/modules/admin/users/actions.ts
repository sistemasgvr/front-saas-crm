"use server";

import { apiFetch } from "@/src/lib/api";
import { actionErr, actionOk, type ActionResult } from "@/src/lib/action-result";

function emptyToUndefined(value: string) {
  return value.trim() === "" ? undefined : value.trim();
}

export async function createUserAction(formData: FormData): Promise<ActionResult> {
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
    return actionOk();
  } catch (error) {
    return actionErr(error, "No se pudo crear el usuario");
  }
}

export async function toggleUserStatusAction(id: string, estado: 0 | 1): Promise<ActionResult> {
  try {
    await apiFetch(`/admin/users/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
    return actionOk();
  } catch (error) {
    return actionErr(error, "No se pudo actualizar el estado");
  }
}

export async function assignUserOrgAction(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    await apiFetch(`/admin/users/${userId}/organizaciones`, {
      method: "POST",
      body: JSON.stringify({
        organizacionId: String(formData.get("organizacionId") ?? ""),
        rol: String(formData.get("rol") ?? ""),
      }),
    });
    return actionOk();
  } catch (error) {
    return actionErr(error, "No se pudo asignar");
  }
}

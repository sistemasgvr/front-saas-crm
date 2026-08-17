"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/src/lib/api";

export interface FormState {
  error?: string;
  success?: string;
}

function emptyToUndefined(value: string) {
  return value.trim() === "" ? undefined : value.trim();
}

export async function createUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
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
        asignacion:
          organizacionId && rol
            ? { organizacionId, rol }
            : undefined,
      }),
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "No se pudo crear el usuario" };
  }
  redirect("/admin/users");
}

export async function toggleUserStatusAction(id: string, estado: 0 | 1) {
  await apiFetch(`/admin/users/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}

export async function assignUserOrgAction(userId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch(`/admin/users/${userId}/organizaciones`, {
      method: "POST",
      body: JSON.stringify({
        organizacionId: String(formData.get("organizacionId") ?? ""),
        rol: String(formData.get("rol") ?? ""),
      }),
    });
    revalidatePath(`/admin/users/${userId}`);
    return { success: "Usuario asignado a la empresa" };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "No se pudo asignar" };
  }
}

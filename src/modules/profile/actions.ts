"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/src/lib/api";

export interface FormState {
  error?: string;
  success?: string;
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch("/me", {
      method: "PATCH",
      body: JSON.stringify({
        nombre: String(formData.get("nombre") ?? "").trim(),
        apellido: String(formData.get("apellido") ?? "").trim() || undefined,
        telefono: String(formData.get("telefono") ?? "").trim() || undefined,
      }),
    });
    revalidatePath("/profile");
    revalidatePath("/admin/profile");
    return { success: "Perfil actualizado" };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "No se pudo guardar el perfil" };
  }
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const passwordActual = String(formData.get("passwordActual") ?? "");
  const passwordNueva = String(formData.get("passwordNueva") ?? "");
  if (passwordNueva.length < 8) {
    return { error: "La contraseña nueva debe tener al menos 8 caracteres" };
  }
  try {
    await apiFetch("/me/password", {
      method: "PATCH",
      body: JSON.stringify({ passwordActual, passwordNueva }),
    });
    return { success: "Contraseña actualizada" };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "No se pudo cambiar la contraseña" };
  }
}

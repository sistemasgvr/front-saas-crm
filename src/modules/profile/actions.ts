"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function updateProfileAction(formData: FormData) {
  try {
    await apiFetch("/me", {
      method: "PATCH",
      body: JSON.stringify({
        nombre: String(formData.get("nombre") ?? "").trim(),
        apellido: String(formData.get("apellido") ?? "").trim() || undefined,
        telefono: String(formData.get("telefono") ?? "").trim() || undefined,
      }),
    });
  } catch (error) {
    fail(error, "No se pudo guardar el perfil");
  }
}

export async function changePasswordAction(formData: FormData) {
  const passwordActual = String(formData.get("passwordActual") ?? "");
  const passwordNueva = String(formData.get("passwordNueva") ?? "");
  if (passwordNueva.length < 8) {
    throw new Error("La contraseña nueva debe tener al menos 8 caracteres");
  }
  try {
    await apiFetch("/me/password", {
      method: "PATCH",
      body: JSON.stringify({ passwordActual, passwordNueva }),
    });
  } catch (error) {
    fail(error, "No se pudo cambiar la contraseña");
  }
}

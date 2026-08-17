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

export async function createModuleAction(_prev: FormState, formData: FormData): Promise<FormState> {
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
    return { error: error instanceof ApiError ? error.message : "No se pudo crear el módulo" };
  }
  redirect("/admin/modules");
}

export async function updateModuleAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
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
    revalidatePath("/admin/modules");
    return { success: "Módulo actualizado" };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "No se pudo guardar" };
  }
}

export async function toggleModuleStatusAction(id: string, estado: 0 | 1) {
  await apiFetch(`/admin/modules/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
  revalidatePath("/admin/modules");
}

"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/src/lib/api";

export interface FormState {
  error?: string;
  success?: string;
}

function emptyToUndefined(value: string) {
  return value.trim() === "" ? undefined : value.trim();
}

export async function updateOrganizationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await apiFetch("/organizations/current", {
      method: "PATCH",
      body: JSON.stringify({
        nombre: String(formData.get("nombre") ?? "").trim(),
        razonSocial: emptyToUndefined(String(formData.get("razonSocial") ?? "")),
        documentoFiscal: emptyToUndefined(String(formData.get("documentoFiscal") ?? "")),
        emailContacto: emptyToUndefined(String(formData.get("emailContacto") ?? "")),
        telefonoContacto: emptyToUndefined(String(formData.get("telefonoContacto") ?? "")),
        logoUrl: emptyToUndefined(String(formData.get("logoUrl") ?? "")),
        pais: emptyToUndefined(String(formData.get("pais") ?? "")),
        zonaHoraria: emptyToUndefined(String(formData.get("zonaHoraria") ?? "")),
      }),
    });
    revalidatePath("/settings");
    return { success: "Organización actualizada" };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "No se pudo guardar" };
  }
}

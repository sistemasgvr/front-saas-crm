"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function emptyToUndefined(value: string) {
  return value.trim() === "" ? undefined : value.trim();
}

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function updateOrganizationAction(formData: FormData) {
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
  } catch (error) {
    fail(error, "No se pudo guardar");
  }
}

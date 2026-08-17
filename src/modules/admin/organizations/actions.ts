"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function emptyToUndefined(value: string) {
  return value.trim() === "" ? undefined : value.trim();
}

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function createOrganizationAction(formData: FormData) {
  try {
    const primerNombre = String(formData.get("primerNombre") ?? "").trim();
    const primerEmail = String(formData.get("primerEmail") ?? "").trim();
    const primerPassword = String(formData.get("primerPassword") ?? "");

    await apiFetch("/admin/organizations", {
      method: "POST",
      body: JSON.stringify({
        nombre: String(formData.get("nombre") ?? "").trim(),
        slug: String(formData.get("slug") ?? "").trim(),
        razonSocial: emptyToUndefined(String(formData.get("razonSocial") ?? "")),
        documentoFiscal: emptyToUndefined(String(formData.get("documentoFiscal") ?? "")),
        emailContacto: emptyToUndefined(String(formData.get("emailContacto") ?? "")),
        telefonoContacto: emptyToUndefined(String(formData.get("telefonoContacto") ?? "")),
        pais: emptyToUndefined(String(formData.get("pais") ?? "")) ?? "PE",
        zonaHoraria: emptyToUndefined(String(formData.get("zonaHoraria") ?? "")) ?? "America/Lima",
        primerUsuario:
          primerNombre && primerEmail && primerPassword
            ? {
                nombre: primerNombre,
                apellido: emptyToUndefined(String(formData.get("primerApellido") ?? "")),
                email: primerEmail,
                password: primerPassword,
              }
            : undefined,
      }),
    });
  } catch (error) {
    fail(error, "No se pudo crear la empresa");
  }
}

export async function updateOrganizationAdminAction(id: string, formData: FormData) {
  try {
    await apiFetch(`/admin/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        nombre: String(formData.get("nombre") ?? "").trim(),
        slug: String(formData.get("slug") ?? "").trim(),
        razonSocial: emptyToUndefined(String(formData.get("razonSocial") ?? "")),
        documentoFiscal: emptyToUndefined(String(formData.get("documentoFiscal") ?? "")),
        emailContacto: emptyToUndefined(String(formData.get("emailContacto") ?? "")),
        telefonoContacto: emptyToUndefined(String(formData.get("telefonoContacto") ?? "")),
        pais: emptyToUndefined(String(formData.get("pais") ?? "")),
        zonaHoraria: emptyToUndefined(String(formData.get("zonaHoraria") ?? "")),
        notas: emptyToUndefined(String(formData.get("notas") ?? "")),
      }),
    });
  } catch (error) {
    fail(error, "No se pudo guardar");
  }
}

export async function deactivateOrganizationAction(id: string) {
  try {
    await apiFetch(`/admin/organizations/${id}/desactivar`, { method: "PATCH" });
  } catch (error) {
    fail(error, "No se pudo desactivar la empresa");
  }
}

export async function toggleOrganizationModuleAction(organizacionId: string, moduloId: string, habilitado: boolean) {
  try {
    await apiFetch(`/admin/organizations/${organizacionId}/modules/${moduloId}`, {
      method: "PATCH",
      body: JSON.stringify({ habilitado }),
    });
  } catch (error) {
    fail(error, "No se pudo actualizar el módulo");
  }
}

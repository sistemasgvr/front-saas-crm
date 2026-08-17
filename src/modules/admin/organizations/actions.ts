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

export async function createOrganizationAction(_prev: FormState, formData: FormData): Promise<FormState> {
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
    return { error: error instanceof ApiError ? error.message : "No se pudo crear la empresa" };
  }
  redirect("/admin/organizations");
}

export async function updateOrganizationAdminAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
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
    revalidatePath(`/admin/organizations/${id}`);
    revalidatePath("/admin/organizations");
    return { success: "Empresa actualizada" };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "No se pudo guardar" };
  }
}

export async function deactivateOrganizationAction(id: string): Promise<void> {
  await apiFetch(`/admin/organizations/${id}/desactivar`, { method: "PATCH" });
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${id}`);
}

export async function toggleOrganizationModuleAction(organizacionId: string, moduloId: string, habilitado: boolean) {
  await apiFetch(`/admin/organizations/${organizacionId}/modules/${moduloId}`, {
    method: "PATCH",
    body: JSON.stringify({ habilitado }),
  });
  revalidatePath(`/admin/organizations/${organizacionId}`);
}

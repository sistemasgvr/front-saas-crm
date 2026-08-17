import { ApiError, apiFetch } from "@/src/lib/api";
import { getMe } from "@/src/lib/auth";
import OrganizationSettingsForm from "@/src/modules/settings/OrganizationSettingsForm";
import type { OrganizacionActual } from "@/src/modules/settings/types";

export default async function SettingsPage() {
  const me = await getMe();
  const canEdit = me?.rol === "PROPIETARIO" || me?.rol === "ADMINISTRADOR";

  let org: OrganizacionActual | null = null;
  let error: string | null = null;
  if (canEdit) {
    try {
      org = await apiFetch<OrganizacionActual>("/organizations/current");
    } catch (e) {
      error = e instanceof ApiError ? e.message : "No se pudo cargar la organización";
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">Configuración</h1>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {!canEdit && (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Solo el propietario o un administrador pueden editar los datos de la empresa.
          </p>
        )}
        {error && <p className="text-sm text-error-500">{error}</p>}
        {org && <OrganizationSettingsForm org={org} />}
      </div>
    </div>
  );
}

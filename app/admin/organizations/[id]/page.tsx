import { apiFetch } from "@/src/lib/api";
import EditOrganizationForm from "@/src/modules/admin/organizations/EditOrganizationForm";
import ModulesMatrix from "@/src/modules/admin/organizations/ModulesMatrix";
import { deactivateOrganizationAction } from "@/src/modules/admin/organizations/actions";
import type { ModuloMatriz, OrganizacionAdmin } from "@/src/modules/admin/types";
import Button from "@/src/components/ui/button/Button";

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [org, modulos] = await Promise.all([
    apiFetch<OrganizacionAdmin>(`/admin/organizations/${id}`),
    apiFetch<ModuloMatriz[]>(`/admin/organizations/${id}/modules`),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{org.nombre}</h1>
        {org.estado === 1 && (
          <form action={deactivateOrganizationAction.bind(null, org.id)}>
            <Button type="submit" size="sm" variant="outline">
              Desactivar
            </Button>
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Datos</h2>
        <EditOrganizationForm org={org} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Módulos</h2>
        <ModulesMatrix organizacionId={org.id} modulos={modulos} />
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import ActionButton from "@/src/components/ui/ActionButton";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import EditOrganizationForm from "./EditOrganizationForm";
import ModulesMatrix from "./ModulesMatrix";
import { deactivateOrganizationAction } from "./actions";
import { getAdminOrganization, getAdminOrganizationModules } from "./queries";

export default function OrganizationDetailView({ id }: { id: string }) {
  const orgQuery = useQuery({
    queryKey: queryKeys.adminOrganization(id),
    queryFn: () => getAdminOrganization(id),
  });
  const modulesQuery = useQuery({
    queryKey: queryKeys.adminOrganizationModules(id),
    queryFn: () => getAdminOrganizationModules(id),
  });

  if (orgQuery.isLoading || modulesQuery.isLoading) return <PageLoader />;
  if (orgQuery.isError) return <QueryError error={orgQuery.error} />;
  if (modulesQuery.isError) return <QueryError error={modulesQuery.error} />;
  if (!orgQuery.data) return null;

  const org = orgQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{org.nombre}</h1>
        {org.estado === 1 && (
          <ActionButton
            action={() => deactivateOrganizationAction(org.id)}
            successMessage="Empresa desactivada"
            loadingText="Desactivando…"
            invalidateKeys={[queryKeys.adminOrganizationsAll, queryKeys.adminOrganization(org.id)]}
          >
            Desactivar
          </ActionButton>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Datos</h2>
        <EditOrganizationForm org={org} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Módulos</h2>
        <ModulesMatrix organizacionId={org.id} modulos={modulesQuery.data ?? []} />
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import ActionButton from "@/src/components/ui/ActionButton";
import Avatar from "@/src/components/ui/avatar/Avatar";
import { StatusBadge } from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
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
      <PageHeader title={org.nombre} description={org.slug} backHref="/admin/organizations" backLabel="Volver a empresas">
        {org.estado === 1 && (
          <ActionButton
            action={() => deactivateOrganizationAction(org.id)}
            successMessage="Empresa desactivada"
            loadingText="Desactivando…"
            startIcon={<Icon name="mdi:domain-off" size={18} />}
            invalidateKeys={[queryKeys.adminOrganizationsAll, queryKeys.adminOrganization(org.id)]}
          >
            Desactivar
          </ActionButton>
        )}
      </PageHeader>

      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <Avatar name={org.nombre} src={org.logoUrl} shape="rounded" size="xl" icon="mdi:office-building-outline" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-gray-800 dark:text-white/90">{org.nombre}</p>
          <p className="truncate text-theme-sm text-gray-500">{org.slug}</p>
          <div className="mt-2">
            <StatusBadge active={org.estado === 1} activeLabel="Activa" inactiveLabel="Desactivada" />
          </div>
        </div>
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

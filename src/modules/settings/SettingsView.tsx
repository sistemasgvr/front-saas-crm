"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/keys";
import { getMeQuery } from "@/src/modules/auth/queries";
import { getCurrentOrganization } from "./queries";
import { canManageOrganization } from "@/src/lib/roles";
import OrganizationSettingsForm from "./OrganizationSettingsForm";
import MetaConnectionCard from "./meta/MetaConnectionCard";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";

export default function SettingsView({ metaCallback }: { metaCallback?: string }) {
  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: () => getMeQuery() });
  const canEdit = canManageOrganization(meQuery.data?.rol);
  const orgQuery = useQuery({
    queryKey: queryKeys.organizationCurrent,
    queryFn: () => getCurrentOrganization(),
    enabled: canEdit,
  });

  if (meQuery.isLoading) return <PageLoader label="Cargando permisos…" />;
  if (meQuery.isError) return <QueryError error={meQuery.error} />;

  if (!canEdit || !meQuery.data) {
    return (
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">
        Solo el propietario o un administrador pueden editar los datos de la empresa.
      </p>
    );
  }

  const me = meQuery.data;
  const metaLeadsHabilitado = me.modulos.some((m) => m.codigo === "META_LEADS" && m.habilitado);

  return (
    <div className="space-y-6">
      {orgQuery.isLoading ? (
        <PageLoader label="Cargando datos de la empresa…" />
      ) : orgQuery.isError ? (
        <QueryError error={orgQuery.error} />
      ) : orgQuery.data ? (
        <OrganizationSettingsForm org={orgQuery.data} />
      ) : (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          No se pudieron cargar los datos de la empresa.
        </p>
      )}

      {metaLeadsHabilitado && <MetaConnectionCard metaCallback={metaCallback} />}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/keys";
import { getMeQuery } from "@/src/modules/auth/queries";
import { getCurrentOrganization } from "./queries";
import OrganizationSettingsForm from "./OrganizationSettingsForm";
import MetaConnectionCard from "./meta/MetaConnectionCard";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";

export default function SettingsView() {
  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: () => getMeQuery() });
  const canEdit = meQuery.data?.rol === "PROPIETARIO" || meQuery.data?.rol === "ADMINISTRADOR";
  const orgQuery = useQuery({
    queryKey: queryKeys.organizationCurrent,
    queryFn: () => getCurrentOrganization(),
    enabled: canEdit,
  });

  if (meQuery.isLoading || (canEdit && orgQuery.isLoading)) {
    return <PageLoader />;
  }
  if (meQuery.isError) return <QueryError error={meQuery.error} />;
  if (!canEdit) {
    return (
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">
        Solo el propietario o un administrador pueden editar los datos de la empresa.
      </p>
    );
  }
  if (orgQuery.isError) return <QueryError error={orgQuery.error} />;
  if (!orgQuery.data) return null;

  const metaLeadsHabilitado = meQuery.data?.modulos.some((m) => m.codigo === "META_LEADS" && m.habilitado);

  return (
    <div>
      <OrganizationSettingsForm org={orgQuery.data} />
      {metaLeadsHabilitado && <MetaConnectionCard />}
    </div>
  );
}

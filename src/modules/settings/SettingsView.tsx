"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/keys";
import { getMeQuery } from "@/src/modules/auth/queries";
import { getCurrentOrganization } from "./queries";
import { canManageOrganization } from "@/src/lib/roles";
import OrganizationSettingsForm from "./OrganizationSettingsForm";
import MetaSettingsEntryCard from "./meta/MetaSettingsEntryCard";
import WhatsappSettingsEntryCard from "./whatsapp/WhatsappSettingsEntryCard";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";

export default function SettingsView() {
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
  const whatsappHabilitado = me.modulos.some((m) => m.codigo === "WHATSAPP" && m.habilitado);

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Datos de la empresa y conexión con Meta." />
      {orgQuery.isLoading ? (
        <PageLoader label="Cargando datos de la empresa…" />
      ) : orgQuery.isError ? (
        <QueryError error={orgQuery.error} />
      ) : orgQuery.data ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Datos de la empresa</h2>
          <OrganizationSettingsForm org={orgQuery.data} />
        </div>
      ) : (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          No se pudieron cargar los datos de la empresa.
        </p>
      )}

      {metaLeadsHabilitado && <MetaSettingsEntryCard />}
      {whatsappHabilitado && <WhatsappSettingsEntryCard />}
    </div>
  );
}

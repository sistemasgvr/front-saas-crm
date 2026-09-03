"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/keys";
import { getMeQuery } from "@/src/modules/auth/queries";
import { getCurrentOrganization } from "./queries";
import { canManageOrganization } from "@/src/lib/roles";
import type { ModuloEstado } from "@/src/lib/auth";
import OrganizationSettingsForm from "./OrganizationSettingsForm";
import MetaSettingsEntryCard from "./meta/MetaSettingsEntryCard";
import WhatsappSettingsEntryCard from "./whatsapp/WhatsappSettingsEntryCard";
import LeadAutoAssignmentSettingsCard from "./leads/LeadAutoAssignmentSettingsCard";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
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
  const metaLeadsHabilitado = me.modulos.some((m: ModuloEstado) => m.codigo === "META_LEADS" && m.habilitado);
  const whatsappHabilitado = me.modulos.some((m: ModuloEstado) => m.codigo === "WHATSAPP" && m.habilitado);

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Datos de la empresa y conexión con Meta." />
      {orgQuery.isLoading ? (
        <PageLoader label="Cargando datos de la empresa…" />
      ) : orgQuery.isError ? (
        <QueryError error={orgQuery.error} />
      ) : orgQuery.data ? (
        <CollapsibleSection
          title="Datos de la empresa"
          icon="mdi:office-building-outline"
          help="Nombre, contacto, país y zona horaria de esta organización."
          preview={orgQuery.data.nombre}
          defaultOpen
        >
          <OrganizationSettingsForm org={orgQuery.data} />
        </CollapsibleSection>
      ) : (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          No se pudieron cargar los datos de la empresa.
        </p>
      )}

      {metaLeadsHabilitado && (
        <>
          <MetaSettingsEntryCard />
          <LeadAutoAssignmentSettingsCard />
        </>
      )}
      {whatsappHabilitado && <WhatsappSettingsEntryCard />}
    </div>
  );
}

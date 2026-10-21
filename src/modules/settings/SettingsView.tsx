"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/keys";
import { getMeQuery } from "@/src/modules/auth/queries";
import { getCurrentOrganization } from "./queries";
import { canManageOrganization } from "@/src/lib/roles";
import type { ModuloEstado } from "@/src/lib/auth";
import OrganizationSettingsForm from "./OrganizationSettingsForm";
import MetaSettingsEntryCard from "./meta/MetaSettingsEntryCard";
import WhatsappSettingsEntryCard from "./whatsapp/WhatsappSettingsEntryCard";
import BotSettingsCard from "./automations/BotSettingsCard";
import LeadAutoAssignmentSettingsCard from "./leads/LeadAutoAssignmentSettingsCard";
import PipelineConfigSettingsCard from "./pipeline/PipelineConfigSettingsCard";
import InmueblesSettingsEntryCard from "./inmuebles/InmueblesSettingsEntryCard";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { isModuloHabilitado } from "@/src/lib/modules";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";

export default function SettingsView() {
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => getMeQuery(),
  });
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
        Solo el propietario o un administrador pueden editar los datos de la
        empresa.
      </p>
    );
  }

  const me = meQuery.data;
  const leadsHabilitado = isModuloHabilitado(me.modulos, "LEADS");
  const metaLeadsHabilitado = me.modulos.some(
    (m: ModuloEstado) => m.codigo === "META_LEADS" && m.habilitado,
  );
  const whatsappHabilitado = me.modulos.some(
    (m: ModuloEstado) => m.codigo === "WHATSAPP" && m.habilitado,
  );
  const inmueblesHabilitado = isModuloHabilitado(me.modulos, "INMUEBLES");
  const automatizacionesHabilitado = isModuloHabilitado(
    me.modulos,
    "AUTOMATIZACIONES",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Datos de la empresa y conexión con Meta."
      />
      <h2 className="text-lg font-semibold">Empresa</h2>
      <CollapsibleSection
        title="Usuarios"
        icon="mdi:account-group-outline"
        help="Administra los roles y el acceso del equipo según el límite del plan."
        preview="Gestiona los usuarios de tu empresa."
        defaultOpen={false}
      >
        <Link href="/settings/users">
          <Button
            size="sm"
            startIcon={<Icon name="mdi:account-group-outline" size={18} />}
          >
            Gestionar usuarios
          </Button>
        </Link>
      </CollapsibleSection>
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
          defaultOpen={false}
        >
          <OrganizationSettingsForm org={orgQuery.data} />
        </CollapsibleSection>
      ) : (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          No se pudieron cargar los datos de la empresa.
        </p>
      )}

      {(leadsHabilitado || inmueblesHabilitado) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">CRM</h2>
          {leadsHabilitado && (
            <>
              <PipelineConfigSettingsCard />
              <LeadAutoAssignmentSettingsCard />
            </>
          )}
          {inmueblesHabilitado && <InmueblesSettingsEntryCard rol={me.rol} />}
        </section>
      )}
      {(metaLeadsHabilitado || whatsappHabilitado) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Meta</h2>
          {metaLeadsHabilitado && <MetaSettingsEntryCard />}
          {whatsappHabilitado && <WhatsappSettingsEntryCard />}
          {whatsappHabilitado && automatizacionesHabilitado && (
            <BotSettingsCard />
          )}
        </section>
      )}
    </div>
  );
}

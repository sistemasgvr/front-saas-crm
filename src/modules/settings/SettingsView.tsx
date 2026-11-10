"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/keys";
import { getMeQuery } from "@/src/modules/auth/queries";
import { getCurrentOrganization } from "./queries";
import {
  puedeVerConfiguracion,
  tienePermiso,
  type CodigoPermiso,
} from "@/src/lib/permisos";
import OrganizationSettingsForm from "./OrganizationSettingsForm";
import MetaSettingsEntryCard from "./meta/MetaSettingsEntryCard";
import WhatsappSettingsEntryCard from "./whatsapp/WhatsappSettingsEntryCard";
import BotSettingsCard from "./automations/BotSettingsCard";
import LeadAutoAssignmentSettingsCard from "./leads/LeadAutoAssignmentSettingsCard";
import PipelineConfigSettingsCard from "./pipeline/PipelineConfigSettingsCard";
import InmueblesSettingsEntryCard from "./inmuebles/InmueblesSettingsEntryCard";
import DataExportCard from "./DataExportCard";
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
  const permisos = meQuery.data?.permisos;
  const puede = (codigo: CodigoPermiso) => tienePermiso(permisos, codigo);
  const canEdit = puedeVerConfiguracion(permisos);
  const orgQuery = useQuery({
    queryKey: queryKeys.organizationCurrent,
    queryFn: () => getCurrentOrganization(),
    enabled: puede("empresa.configurar"),
  });

  if (meQuery.isLoading) return <PageLoader label="Cargando permisos…" />;
  if (meQuery.isError) return <QueryError error={meQuery.error} />;

  if (!canEdit || !meQuery.data) {
    return (
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">
        Tu rol no tiene permisos de configuración. Pide acceso a un
        administrador de la empresa.
      </p>
    );
  }

  const me = meQuery.data;
  // Los permisos efectivos ya vienen limitados por los módulos activos.
  const configuraLeads = puede("leads.configurar");
  const creaInmuebles = puede("inmuebles.crear");
  const configuraMeta = puede("meta.configurar");
  const configuraWhatsapp = puede("whatsapp.configurar");
  const configuraBot =
    puede("bot.configurar") &&
    isModuloHabilitado(me.modulos, "AUTOMATIZACIONES");
  const empresa = puede("empresa.configurar");
  const usuarios = puede("usuarios.gestionar");
  const roles = puede("roles.gestionar");
  // Exportar saca TODOS los datos de la empresa: solo dueño/admin (igual que el backend).
  const exporta = me.rol === "PROPIETARIO" || me.rol === "ADMINISTRADOR";

  return (
    <div data-tour="settings-page" className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Datos de la empresa y conexión con Meta."
      />
      {(empresa || usuarios || roles || exporta) && (
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Empresa</h2>
      )}
      {usuarios && (
        <CollapsibleSection
          title="Usuarios"
          icon="mdi:account-group-outline"
          help="Administra el acceso del equipo según el límite del plan."
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
      )}
      {roles && (
        <CollapsibleSection
          title="Roles y permisos"
          icon="mdi:shield-account-outline"
          help="Define qué puede ver y hacer cada rol dentro de los módulos activos de tu plan."
          preview="Crea roles y ajusta sus permisos."
          defaultOpen={false}
        >
          <Link href="/settings/roles">
            <Button
              size="sm"
              startIcon={<Icon name="mdi:shield-account-outline" size={18} />}
            >
              Gestionar roles
            </Button>
          </Link>
        </CollapsibleSection>
      )}
      {empresa &&
        (orgQuery.isLoading ? (
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
        ))}
      {exporta && <DataExportCard />}

      {(configuraLeads || creaInmuebles) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">CRM</h2>
          {configuraLeads && (
            <>
              <PipelineConfigSettingsCard />
              <LeadAutoAssignmentSettingsCard />
            </>
          )}
          {creaInmuebles && <InmueblesSettingsEntryCard />}
        </section>
      )}
      {(configuraMeta || configuraWhatsapp || configuraBot) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Meta</h2>
          {configuraMeta && <MetaSettingsEntryCard />}
          {configuraWhatsapp && <WhatsappSettingsEntryCard />}
          {configuraBot && <BotSettingsCard />}
        </section>
      )}
    </div>
  );
}

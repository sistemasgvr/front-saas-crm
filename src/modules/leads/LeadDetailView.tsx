"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import Button from "@/src/components/ui/button/Button";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import { Icon } from "@/src/components/ui/Icon";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { canManageOrganization } from "@/src/lib/roles";
import LeadAssignmentActions from "./LeadAssignmentActions";
import LeadPipelinePanel from "./LeadPipelinePanel";
import LeadVisitasPanel from "./LeadVisitasPanel";
import {
  etiquetaCampoMeta,
  iconoCampoMeta,
  parsearMetaLeadPayload,
  valorCampoMeta,
} from "./meta-lead-payload";
import { getLead } from "./queries";
import { iniciarChatDesdeLeadAction } from "@/src/modules/chats/actions";

type Rol = "PROPIETARIO" | "ADMINISTRADOR" | "USUARIO" | null;

function formatearFecha(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Campo({
  label,
  value,
  icon,
  compact = false,
}: {
  label: string;
  value: string;
  icon: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 ${compact ? "" : ""}`}>
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300 ${
          compact ? "mt-0.5 h-8 w-8" : "mt-0.5 h-9 w-9"
        }`}
      >
        <Icon name={icon} size={compact ? 16 : 18} />
      </span>
      <div className="min-w-0">
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="break-words text-theme-sm text-gray-800 dark:text-white/90">{value}</p>
      </div>
    </div>
  );
}

function SeccionFija({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
          <Icon name={icon} size={18} className="text-brand-600 dark:text-brand-400" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function resumenOrigen(lead: {
  campana?: { nombre: string } | null;
  anuncio?: { nombre: string } | null;
  conjuntoAnuncio?: { nombre: string } | null;
}) {
  const partes = [lead.campana?.nombre, lead.conjuntoAnuncio?.nombre, lead.anuncio?.nombre].filter(Boolean);
  if (partes.length === 0) return "Sin datos de campaña vinculados";
  return partes.join(" · ");
}

export default function LeadDetailView({
  id,
  rol,
  usuarioId,
  whatsappHabilitado,
}: {
  id: string;
  rol: Rol;
  usuarioId: string;
  whatsappHabilitado: boolean;
}) {
  const router = useRouter();
  const leadQuery = useQuery({ queryKey: queryKeys.lead(id), queryFn: () => getLead(id) });
  const iniciarChat = useAppMutation({
    mutationFn: () => iniciarChatDesdeLeadAction(id),
  });

  if (leadQuery.isLoading) return <PageLoader />;
  if (leadQuery.isError) {
    const message = leadQuery.error instanceof Error ? leadQuery.error.message : "";
    if (message.toLowerCase().includes("no encontrado")) {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">Lead no encontrado</h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            El lead no existe o ya no está disponible en tu organización.
          </p>
          <Link
            href="/leads"
            className="mt-4 inline-flex items-center gap-1 text-theme-sm text-brand-600 hover:underline dark:text-brand-400"
          >
            <Icon name="mdi:chevron-left" size={18} />
            Volver a Leads
          </Link>
        </div>
      );
    }
    return <QueryError error={leadQuery.error} />;
  }
  if (!leadQuery.data) return null;

  const lead = leadQuery.data;
  const nombre = lead.nombre ?? "Sin nombre";
  const meta = parsearMetaLeadPayload(lead.datosCrudos);
  const respuestas = meta?.field_data ?? [];
  const previewRespuestas =
    respuestas.length === 0
      ? "Sin respuestas guardadas"
      : respuestas.length === 1
        ? valorCampoMeta(respuestas[0].values)
        : `${respuestas.length} campos · ${valorCampoMeta(respuestas[0].values)}`;

  return (
    <div className="space-y-4">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-theme-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <Icon name="mdi:chevron-left" size={18} />
        Volver a Leads
      </Link>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
        <Avatar name={nombre} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-gray-800 dark:text-white/90">{nombre}</h1>
          <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="inline-flex items-center gap-1.5 text-theme-sm text-gray-600 dark:text-gray-300">
              <Icon name="mdi:email-outline" size={16} className="shrink-0 text-gray-400" />
              {lead.email ?? "Sin email"}
            </span>
            {lead.telefono ? (
              <span className="inline-flex items-center gap-1.5 text-theme-sm text-gray-600 dark:text-gray-300">
                <Icon name="mdi:phone-outline" size={16} className="shrink-0 text-gray-400" />
                {lead.telefono}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-theme-sm text-gray-500 dark:text-gray-400">
              <Icon name="mdi:calendar-clock-outline" size={16} className="shrink-0" />
              {formatearFecha(lead.fechaLead ?? meta?.created_time)}
            </span>
          </div>
        </div>
      </div>

      <SeccionFija
        title="Gestión y seguimiento"
        icon="mdi:account-cog-outline"
        description="Asignación, tipo de lead y avance en el embudo."
      >
        <div className="flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            {lead.asignado ? (
              <span className="inline-flex items-center gap-1.5 text-theme-sm text-gray-700 dark:text-gray-200">
                <Icon name="mdi:account-check-outline" size={16} className="shrink-0 text-success-500" />
                Asignado a <span className="font-medium">{lead.asignado.nombre}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-theme-sm text-warning-500">
                <Icon name="mdi:account-question-outline" size={16} className="shrink-0" />
                Sin asignar
              </span>
            )}
            <LeadAssignmentActions leadId={id} asignado={lead.asignado} rol={rol} />
          </div>

          <span
            className="w-full sm:w-auto"
            title={
              !whatsappHabilitado
                ? "Activa el módulo WhatsApp en Configuración"
                : !lead.telefono
                  ? "Este lead no tiene teléfono registrado"
                  : undefined
            }
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={!whatsappHabilitado || !lead.telefono}
              loading={iniciarChat.isPending}
              startIcon={<Icon name="mdi:whatsapp" size={18} />}
              onClick={() =>
                iniciarChat.mutate(undefined, {
                  onSuccess: (resultado) => {
                    router.push(`/chats/${resultado.conversacionId}`);
                  },
                })
              }
            >
              Iniciar chat
            </Button>
          </span>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
          <LeadPipelinePanel
            leadId={id}
            tipoLead={lead.tipoLead}
            estadoGestion={lead.estadoGestion}
            estadoGestionEn={lead.estadoGestionEn}
            motivoCierre={lead.motivoCierre}
            notaCierre={lead.notaCierre}
            esAdmin={canManageOrganization(rol)}
            puedeGestionar={canManageOrganization(rol) || lead.asignado?.id === usuarioId}
          />
        </div>
      </SeccionFija>

      <CollapsibleSection
        title="Visitas y agenda"
        icon="mdi:calendar-month-outline"
        description="Citas estructuradas — alimentan la vista calendario del equipo."
        defaultOpen
      >
        <LeadVisitasPanel leadId={id} />
      </CollapsibleSection>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CollapsibleSection
          title="Respuestas del formulario"
          icon="mdi:form-select"
          description="Lo que el contacto completó en el Lead Ad de Meta."
          preview={previewRespuestas}
          badge={respuestas.length > 0 ? `${respuestas.length}` : undefined}
          defaultOpen={respuestas.length > 0 && respuestas.length <= 6}
        >
          {respuestas.length === 0 ? (
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              No hay respuestas de formulario guardadas para este lead.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {respuestas.map((campo) => (
                <Campo
                  key={campo.name}
                  label={etiquetaCampoMeta(campo.name)}
                  value={valorCampoMeta(campo.values)}
                  icon={iconoCampoMeta(campo.name)}
                  compact
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Origen publicitario"
          icon="mdi:bullhorn-outline"
          description="Campaña, anuncio y datos técnicos de trazabilidad."
          preview={resumenOrigen(lead)}
          defaultOpen={false}
        >
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                Publicidad
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo label="Campaña" value={lead.campana?.nombre ?? "—"} icon="mdi:bullhorn-outline" compact />
                <Campo
                  label="Conjunto de anuncios"
                  value={lead.conjuntoAnuncio?.nombre ?? "—"}
                  icon="mdi:layers-outline"
                  compact
                />
                <Campo label="Anuncio" value={lead.anuncio?.nombre ?? "—"} icon="mdi:image-outline" compact />
                <Campo
                  label="Formulario"
                  value={lead.formularioId ?? meta?.form_id ?? "—"}
                  icon="mdi:form-select"
                  compact
                />
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="mb-3 text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                Trazabilidad
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo label="ID externo (Meta)" value={lead.idExterno} icon="mdi:identifier" compact />
                <Campo
                  label="Creado en Meta"
                  value={formatearFecha(meta?.created_time ?? lead.fechaLead)}
                  icon="mdi:calendar-clock-outline"
                  compact
                />
                <Campo
                  label="Recibido en CRM"
                  value={formatearFecha(lead.fechaCreacion)}
                  icon="mdi:inbox-arrow-down-outline"
                  compact
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

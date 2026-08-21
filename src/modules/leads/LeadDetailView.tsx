"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import {
  etiquetaCampoMeta,
  iconoCampoMeta,
  parsearMetaLeadPayload,
  valorCampoMeta,
} from "./meta-lead-payload";
import { getLead } from "./queries";

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
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="break-words text-theme-sm text-gray-800 dark:text-white/90">{value}</p>
      </div>
    </div>
  );
}

function Seccion({
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
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <Icon name={icon} size={18} className="text-gray-600 dark:text-gray-300" />
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

export default function LeadDetailView({ id }: { id: string }) {
  const leadQuery = useQuery({ queryKey: queryKeys.lead(id), queryFn: () => getLead(id) });

  if (leadQuery.isLoading) return <PageLoader />;
  if (leadQuery.isError) {
    const message = leadQuery.error instanceof Error ? leadQuery.error.message : "";
    if (message.toLowerCase().includes("no encontrado")) {
      return (
        <div>
          <PageHeader
            title="Lead no encontrado"
            description="El lead no existe o ya no está disponible en tu organización."
            backHref="/leads"
            backLabel="Volver a Leads"
          />
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

  return (
    <div className="space-y-4">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1 text-theme-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <Icon name="mdi:chevron-left" size={18} />
        Volver a Leads
      </Link>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <Avatar name={nombre} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-gray-800 dark:text-white/90">{nombre}</h1>
          <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-4">
            <span className="inline-flex items-center gap-1.5 text-theme-sm text-gray-500 dark:text-gray-400">
              <Icon name="mdi:email-outline" size={16} className="shrink-0" />
              {lead.email ?? "Sin email"}
            </span>
            {lead.telefono ? (
              <span className="inline-flex items-center gap-1.5 text-theme-sm text-gray-500 dark:text-gray-400">
                <Icon name="mdi:phone-outline" size={16} className="shrink-0" />
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

      <Seccion
        title="Respuestas del formulario"
        icon="mdi:form-select"
        description="Preguntas y respuestas enviadas en el Lead Ad (field_data de Meta)."
      >
        {respuestas.length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No hay respuestas de formulario guardadas para este lead.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {respuestas.map((campo) => (
              <Campo
                key={campo.name}
                label={etiquetaCampoMeta(campo.name)}
                value={valorCampoMeta(campo.values)}
                icon={iconoCampoMeta(campo.name)}
              />
            ))}
          </div>
        )}
      </Seccion>

      <Seccion
        title="Origen publicitario"
        icon="mdi:bullhorn-outline"
        description="Campaña, conjunto y anuncio asociados a este lead."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Campaña" value={lead.campana?.nombre ?? "—"} icon="mdi:bullhorn-outline" />
          <Campo
            label="Conjunto de anuncios"
            value={lead.conjuntoAnuncio?.nombre ?? "—"}
            icon="mdi:layers-outline"
          />
          <Campo label="Anuncio" value={lead.anuncio?.nombre ?? "—"} icon="mdi:image-outline" />
          <Campo label="Formulario" value={lead.formularioId ?? meta?.form_id ?? "—"} icon="mdi:form-select" />
          <Campo label="ID externo (Meta)" value={lead.idExterno} icon="mdi:identifier" />
          <Campo
            label="Creado en Meta"
            value={formatearFecha(meta?.created_time ?? lead.fechaLead)}
            icon="mdi:calendar-clock-outline"
          />
          <Campo label="Recibido en CRM" value={formatearFecha(lead.fechaCreacion)} icon="mdi:inbox-arrow-down-outline" />
        </div>
      </Seccion>
    </div>
  );
}

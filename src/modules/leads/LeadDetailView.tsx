"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { getLead } from "./queries";

function formatearFecha(iso: string | null) {
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
        <p className="break-all text-theme-sm text-gray-800 dark:text-white/90">{value}</p>
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <Icon name={icon} size={20} className="text-gray-600 dark:text-gray-300" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
          {description ? (
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>
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

  return (
    <div className="space-y-6">
      <PageHeader title={nombre} description={lead.email ?? undefined} backHref="/leads" backLabel="Volver a Leads" />

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <Avatar name={nombre} size="xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-gray-800 dark:text-white/90">{nombre}</p>
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
              {formatearFecha(lead.fechaLead)}
            </span>
          </div>
        </div>
      </div>

      <Seccion
        title="Datos del contacto"
        icon="mdi:account-details-outline"
        description="Información capturada desde el formulario de Meta."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Email" value={lead.email ?? "—"} icon="mdi:email-outline" />
          <Campo label="Teléfono" value={lead.telefono ?? "—"} icon="mdi:phone-outline" />
          <Campo label="Fecha del lead" value={formatearFecha(lead.fechaLead)} icon="mdi:calendar-clock-outline" />
        </div>
      </Seccion>

      <Seccion
        title="Origen publicitario"
        icon="mdi:bullhorn-outline"
        description="Campaña, conjunto y anuncio asociados a este lead."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Campaña" value={lead.campana?.nombre ?? "—"} icon="mdi:bullhorn-outline" />
          <Campo
            label="Conjunto de anuncios"
            value={lead.conjuntoAnuncio?.nombre ?? "—"}
            icon="mdi:layers-outline"
          />
          <Campo label="Anuncio" value={lead.anuncio?.nombre ?? "—"} icon="mdi:image-outline" />
          <Campo label="Formulario" value={lead.formularioId ?? "—"} icon="mdi:form-select" />
          <Campo label="ID externo (Meta)" value={lead.idExterno} icon="mdi:identifier" />
          <Campo label="Recibido en CRM" value={formatearFecha(lead.fechaCreacion)} icon="mdi:inbox-arrow-down-outline" />
        </div>
      </Seccion>

      <Seccion
        title="Datos crudos (Meta Graph API)"
        icon="mdi:code-json"
        description="Respuesta original de Meta; útil para depuración."
      >
        <pre className="max-h-96 overflow-auto rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300">
          {JSON.stringify(lead.datosCrudos, null, 2)}
        </pre>
      </Seccion>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/src/components/ui/Icon";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { getLead } from "./queries";

function formatearFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "medium", timeStyle: "short" });
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-theme-sm text-gray-800 dark:text-white/90">{value}</p>
    </div>
  );
}

export default function LeadDetailView({ id }: { id: string }) {
  const leadQuery = useQuery({ queryKey: queryKeys.lead(id), queryFn: () => getLead(id) });

  if (leadQuery.isLoading) return <PageLoader />;
  if (leadQuery.isError) return <QueryError error={leadQuery.error} />;
  if (!leadQuery.data) return null;

  const lead = leadQuery.data;

  return (
    <div className="space-y-6">
      <Link href="/leads" className="inline-flex items-center gap-1 text-theme-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
        <Icon name="mdi:chevron-left" size={18} />
        Volver a Leads
      </Link>

      <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{lead.nombre ?? "(sin nombre)"}</h1>

      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-3">
        <Campo label="Email" value={lead.email ?? "—"} />
        <Campo label="Teléfono" value={lead.telefono ?? "—"} />
        <Campo label="Fecha del lead" value={formatearFecha(lead.fechaLead)} />
        <Campo label="Campaña" value={lead.campana?.nombre ?? "—"} />
        <Campo label="Conjunto de anuncios" value={lead.conjuntoAnuncio?.nombre ?? "—"} />
        <Campo label="Anuncio" value={lead.anuncio?.nombre ?? "—"} />
        <Campo label="Formulario" value={lead.formularioId ?? "—"} />
        <Campo label="ID externo (Meta)" value={lead.idExterno} />
        <Campo label="Recibido" value={formatearFecha(lead.fechaCreacion)} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-3 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Datos crudos (Meta Graph API)</h2>
        <pre className="max-h-96 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700 dark:bg-white/5 dark:text-gray-300">
          {JSON.stringify(lead.datosCrudos, null, 2)}
        </pre>
      </div>
    </div>
  );
}

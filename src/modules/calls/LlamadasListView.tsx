"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Badge from "@/src/components/ui/badge/Badge";
import EmptyState from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import Input from "@/src/components/form/input/InputField";
import Select from "@/src/components/form/Select";
import { queryKeys } from "@/src/lib/query/keys";
import { getAsignables } from "@/src/modules/leads/queries";
import { getMetricasLlamadas, listarLlamadas } from "./queries";
import {
  etiquetaResultado,
  formatearDuracionSeg,
  type ListarLlamadasFiltro,
} from "./types";

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });
}

const RESULTADO_OPTS = [
  { value: "", label: "Todos los resultados" },
  { value: "CONTESTADA", label: "Contestada" },
  { value: "NO_CONTESTADA", label: "Perdida" },
  { value: "RECHAZADA", label: "Rechazada" },
  { value: "OCUPADO", label: "Ocupado" },
  { value: "FALLIDA", label: "Fallida" },
];

function colorResultado(resultado?: string | null): "success" | "warning" | "error" | "light" {
  const r = (resultado ?? "").toUpperCase();
  if (r === "CONTESTADA") return "success";
  if (r === "NO_CONTESTADA" || r === "OCUPADO") return "warning";
  if (r === "RECHAZADA" || r === "FALLIDA") return "error";
  return "light";
}

export default function LlamadasListView() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [resultado, setResultado] = useState("");
  const [asesorId, setAsesorId] = useState("");
  const [page, setPage] = useState(1);

  const filtro: ListarLlamadasFiltro = useMemo(
    () => ({
      desde: desde ? new Date(desde).toISOString() : undefined,
      hasta: hasta ? new Date(`${hasta}T23:59:59`).toISOString() : undefined,
      resultado: resultado || undefined,
      asesorId: asesorId || undefined,
      page,
    }),
    [desde, hasta, resultado, asesorId, page],
  );

  const listQuery = useQuery({
    queryKey: queryKeys.whatsappCallsList(filtro),
    queryFn: () => listarLlamadas(filtro),
  });

  const metricasQuery = useQuery({
    queryKey: queryKeys.whatsappCallMetricas,
    queryFn: () =>
      getMetricasLlamadas({
        desde: filtro.desde,
        hasta: filtro.hasta,
      }),
  });

  const asesoresQuery = useQuery({
    queryKey: queryKeys.leadsAsignables,
    queryFn: getAsignables,
    staleTime: 60_000,
  });

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const metricas = metricasQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Llamadas"
        description="Historial de llamadas de WhatsApp Business de la organización."
      />

      {metricas ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: metricas.total, icon: "mdi:phone" },
            { label: "Contestadas", value: metricas.contestadas, icon: "mdi:phone-check" },
            { label: "Perdidas", value: metricas.perdidas, icon: "mdi:phone-missed" },
            {
              label: "Duración media",
              value: formatearDuracionSeg(metricas.duracionMediaSeg),
              icon: "mdi:timer-outline",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                <Icon name={c.icon} size={16} />
                {c.label}
              </div>
              <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                {c.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-theme-xs font-medium text-gray-500">Desde</label>
          <Input
            type="date"
            value={desde}
            onChange={(e) => {
              setPage(1);
              setDesde(e.target.value);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-theme-xs font-medium text-gray-500">Hasta</label>
          <Input
            type="date"
            value={hasta}
            onChange={(e) => {
              setPage(1);
              setHasta(e.target.value);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-theme-xs font-medium text-gray-500">Resultado</label>
          <Select
            options={RESULTADO_OPTS}
            value={resultado}
            onChange={(v) => {
              setPage(1);
              setResultado(v);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-theme-xs font-medium text-gray-500">Asesor</label>
          <Select
            options={[
              { value: "", label: "Todos" },
              ...(asesoresQuery.data ?? []).map((a) => ({
                value: a.id,
                label: a.nombre,
              })),
            ]}
            value={asesorId}
            onChange={(v) => {
              setPage(1);
              setAsesorId(v);
            }}
          />
        </div>
      </div>

      {listQuery.isLoading ? (
        <PageLoader />
      ) : listQuery.isError ? (
        <QueryError error={listQuery.error} onRetry={() => void listQuery.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="mdi:phone-outline"
          title="Sin llamadas"
          description="Cuando recibas o realices llamadas por WhatsApp aparecerán aquí."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-theme-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-theme-xs uppercase text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Dirección</th>
                  <th className="px-4 py-3 font-medium">Resultado</th>
                  <th className="px-4 py-3 font-medium">Duración</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Enlace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700 dark:text-gray-200">
                      {formatearFecha(l.inicioEn)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <Icon
                          name={
                            l.direccion === "SALIENTE"
                              ? "mdi:phone-outgoing"
                              : "mdi:phone-incoming"
                          }
                          size={16}
                        />
                        {l.direccion === "SALIENTE" ? "Saliente" : "Entrante"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={colorResultado(l.resultado)} size="sm">
                        {etiquetaResultado(l.resultado, l.estado)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {formatearDuracionSeg(l.duracionSeg)}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-gray-700 dark:text-gray-200">
                      {l.nombreContacto || l.waId || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {l.conversacionId ? (
                          <Link
                            href={`/chats/${l.conversacionId}`}
                            className="text-brand-600 hover:underline dark:text-brand-400"
                          >
                            Chat
                          </Link>
                        ) : null}
                        {l.leadId ? (
                          <Link
                            href={`/leads/${l.leadId}`}
                            className="text-brand-600 hover:underline dark:text-brand-400"
                          >
                            Lead
                          </Link>
                        ) : null}
                        {!l.conversacionId && !l.leadId ? (
                          <span className="text-gray-400">—</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="text-theme-xs text-gray-500">
                Página {page} de {totalPages} · {total} llamadas
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-xs disabled:opacity-40 dark:border-gray-700"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-xs disabled:opacity-40 dark:border-gray-700"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import Select from "@/src/components/form/Select";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { getAnunciosFiltro, getCampanasFiltro, getLeads } from "./queries";

function formatearFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" });
}

export default function LeadsView() {
  const [q, setQ] = useState("");
  const [campanaId, setCampanaId] = useState("");
  const [anuncioId, setAnuncioId] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage] = useState(1);

  const deferredQ = useDeferredValue(q);

  const filtro = { q: deferredQ || undefined, campanaId: campanaId || undefined, anuncioId: anuncioId || undefined, fechaDesde: fechaDesde || undefined, fechaHasta: fechaHasta || undefined, page };

  const campanasQuery = useQuery({ queryKey: queryKeys.metaCampaigns, queryFn: () => getCampanasFiltro() });
  const anunciosQuery = useQuery({ queryKey: queryKeys.metaAds, queryFn: () => getAnunciosFiltro() });
  const leadsQuery = useQuery({ queryKey: queryKeys.leads(filtro), queryFn: () => getLeads(filtro) });

  const cambiarFiltro = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  return (
    <div>
      <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">Leads</h1>

      <div className="mb-4 grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor="q">Buscar</Label>
          <Input
            id="q"
            placeholder="Nombre, email o teléfono"
            defaultValue={q}
            onChange={(e) => cambiarFiltro(setQ)(e.target.value)}
          />
        </div>
        <div>
          <Label>Campaña</Label>
          <Select
            options={(campanasQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            value={campanaId}
            onChange={cambiarFiltro(setCampanaId)}
            placeholder="Todas"
          />
        </div>
        <div>
          <Label>Anuncio</Label>
          <Select
            options={(anunciosQuery.data ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
            value={anuncioId}
            onChange={cambiarFiltro(setAnuncioId)}
            placeholder="Todos"
          />
        </div>
        <div>
          <Label htmlFor="fechaDesde">Desde</Label>
          <Input id="fechaDesde" type="date" defaultValue={fechaDesde} onChange={(e) => cambiarFiltro(setFechaDesde)(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="fechaHasta">Hasta</Label>
          <Input id="fechaHasta" type="date" defaultValue={fechaHasta} onChange={(e) => cambiarFiltro(setFechaHasta)(e.target.value)} />
        </div>
      </div>

      {leadsQuery.isLoading ? (
        <PageLoader />
      ) : leadsQuery.isError ? (
        <QueryError error={leadsQuery.error} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">Nombre</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">Email</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">Teléfono</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">Campaña</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">Anuncio</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">Fecha</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {leadsQuery.data?.data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-theme-sm text-gray-500">
                        No hay leads con estos filtros.
                      </td>
                    </tr>
                  )}
                  {(leadsQuery.data?.data ?? []).map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90">
                        <Link href={`/leads/${lead.id}`} className="text-brand-500 hover:underline">
                          {lead.nombre ?? "(sin nombre)"}
                        </Link>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-500">{lead.email ?? "—"}</TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-500">{lead.telefono ?? "—"}</TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-500">{lead.campana?.nombre ?? "—"}</TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-500">{lead.anuncio?.nombre ?? "—"}</TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-500">{formatearFecha(lead.fechaLead)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {leadsQuery.data && leadsQuery.data.total > 0 && (
            <div className="mt-4 flex items-center justify-between text-theme-sm text-gray-500 dark:text-gray-400">
              <span>
                Página {leadsQuery.data.page} de {leadsQuery.data.totalPages} — {leadsQuery.data.total} leads
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  startIcon={<Icon name="mdi:chevron-left" size={18} />}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= leadsQuery.data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  endIcon={<Icon name="mdi:chevron-right" size={18} />}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

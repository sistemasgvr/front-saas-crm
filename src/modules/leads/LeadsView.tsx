"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import Select from "@/src/components/form/Select";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import EmptyState from "@/src/components/ui/EmptyState";
import PageHeader from "@/src/components/ui/PageHeader";
import Pagination from "@/src/components/ui/Pagination";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import TableCard, { tdClass, tdPrimaryClass, thClass, thClassEnd } from "@/src/components/ui/TableCard";
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
  const [formularioId, setFormularioId] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage] = useState(1);

  const deferredQ = useDeferredValue(q);

  const filtro = {
    q: deferredQ || undefined,
    campanaId: campanaId || undefined,
    anuncioId: anuncioId || undefined,
    formularioId: formularioId || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
    page,
  };

  const campanasQuery = useQuery({ queryKey: queryKeys.metaCampaigns, queryFn: () => getCampanasFiltro() });
  const anunciosQuery = useQuery({ queryKey: queryKeys.metaAds, queryFn: () => getAnunciosFiltro() });
  const leadsQuery = useQuery({ queryKey: queryKeys.leads(filtro), queryFn: () => getLeads(filtro) });

  const cambiarFiltro = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Leads" description="Contactos captados desde formularios de Meta." />

      <div className="mb-4 grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          <Label htmlFor="formularioId">Formulario</Label>
          <Input
            id="formularioId"
            placeholder="ID Meta del formulario"
            defaultValue={formularioId}
            onChange={(e) => cambiarFiltro(setFormularioId)(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="fechaDesde">Desde</Label>
          <Input
            id="fechaDesde"
            type="date"
            defaultValue={fechaDesde}
            onChange={(e) => cambiarFiltro(setFechaDesde)(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="fechaHasta">Hasta</Label>
          <Input
            id="fechaHasta"
            type="date"
            defaultValue={fechaHasta}
            onChange={(e) => cambiarFiltro(setFechaHasta)(e.target.value)}
          />
        </div>
      </div>

      {(campanasQuery.isError || anunciosQuery.isError) && (
        <div className="mb-4 space-y-2">
          {campanasQuery.isError && <QueryError error={campanasQuery.error} />}
          {anunciosQuery.isError && <QueryError error={anunciosQuery.error} />}
        </div>
      )}

      {leadsQuery.isLoading ? (
        <PageLoader />
      ) : leadsQuery.isError ? (
        <QueryError error={leadsQuery.error} />
      ) : (
        <TableCard
          footer={
            leadsQuery.data ? (
              <Pagination
                page={leadsQuery.data.page}
                pageSize={leadsQuery.data.pageSize}
                total={leadsQuery.data.total}
                totalPages={leadsQuery.data.totalPages}
                onPageChange={setPage}
                itemLabel="leads"
              />
            ) : null
          }
        >
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={thClass}>
                  Contacto
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Teléfono
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Campaña
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Anuncio
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Fecha
                </TableCell>
                <TableCell isHeader className={thClassEnd}>
                  Acción
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {leadsQuery.data?.data.length === 0 && (
                <EmptyState
                  colSpan={6}
                  icon="mdi:account-search-outline"
                  title="No hay leads con estos filtros."
                  description="Prueba a cambiar la búsqueda o el rango de fechas."
                />
              )}
              {(leadsQuery.data?.data ?? []).map((lead) => {
                const nombre = lead.nombre ?? "Sin nombre";
                return (
                  <TableRow key={lead.id}>
                    <TableCell className={tdPrimaryClass}>
                      <EntityCell name={nombre} subtitle={lead.email ?? "Sin email"} />
                    </TableCell>
                    <TableCell className={tdClass}>{lead.telefono ?? "—"}</TableCell>
                    <TableCell className={tdClass}>{lead.campana?.nombre ?? "—"}</TableCell>
                    <TableCell className={tdClass}>{lead.anuncio?.nombre ?? "—"}</TableCell>
                    <TableCell className={tdClass}>{formatearFecha(lead.fechaLead)}</TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex justify-end">
                        <TableAction href={`/leads/${lead.id}`} icon="mdi:eye-outline" label={`Ver ${nombre}`} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}

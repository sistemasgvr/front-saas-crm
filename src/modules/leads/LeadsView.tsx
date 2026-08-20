"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import EmptyState from "@/src/components/ui/EmptyState";
import DynamicFilters from "@/src/components/ui/filters/DynamicFilters";
import type { DynamicFilterFieldDef, DynamicFilterValues } from "@/src/components/ui/filters/types";
import PageHeader from "@/src/components/ui/PageHeader";
import Pagination from "@/src/components/ui/Pagination";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import TableCard, { tdClass, tdPrimaryClass, thClass, thClassEnd } from "@/src/components/ui/TableCard";
import { queryKeys } from "@/src/lib/query/keys";
import { getAnunciosFiltro, getCampanasFiltro, getCuentasFiltro, getLeads, getPaginasFiltro } from "./queries";
import type { LeadResumen, ReferenciaNombrada } from "./types";

function formatearFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" });
}

export default function LeadsView() {
  const searchParams = useSearchParams();
  const [values, setValues] = useState<DynamicFilterValues>(() => {
    const init: DynamicFilterValues = {};
    const metaPaginaId = searchParams.get("metaPaginaId");
    const metaCuentaId = searchParams.get("metaCuentaId");
    if (metaPaginaId) init.metaPaginaId = metaPaginaId;
    if (metaCuentaId) init.metaCuentaId = metaCuentaId;
    return init;
  });
  const [page, setPage] = useState(1);
  const deferredQ = useDeferredValue(values.q ?? "");

  const filtro = {
    q: deferredQ.trim() || undefined,
    campanaId: values.campanaId || undefined,
    anuncioId: values.anuncioId || undefined,
    metaPaginaId: values.metaPaginaId || undefined,
    metaCuentaId: values.metaCuentaId || undefined,
    formularioId: values.formularioId || undefined,
    fechaDesde: values.fechaDesde || undefined,
    fechaHasta: values.fechaHasta || undefined,
    page,
  };

  const campanasQuery = useQuery({ queryKey: queryKeys.metaCampaigns, queryFn: () => getCampanasFiltro() });
  const anunciosQuery = useQuery({ queryKey: queryKeys.metaAds, queryFn: () => getAnunciosFiltro() });
  const paginasQuery = useQuery({ queryKey: queryKeys.metaPagesFiltro, queryFn: () => getPaginasFiltro() });
  const cuentasQuery = useQuery({ queryKey: queryKeys.metaAdAccountsFiltro, queryFn: () => getCuentasFiltro() });
  const leadsQuery = useQuery({ queryKey: queryKeys.leads(filtro), queryFn: () => getLeads(filtro) });

  const fields = useMemo<DynamicFilterFieldDef[]>(
    () => [
      { key: "q", label: "Buscar", type: "text", placeholder: "Nombre, email o teléfono" },
      {
        key: "campanaId",
        label: "Campaña",
        type: "select",
        searchable: true,
        placeholder: "Todas",
        searchPlaceholder: "Buscar campaña...",
        options: (campanasQuery.data ?? []).map((campana: ReferenciaNombrada) => ({
          value: campana.id,
          label: campana.nombre,
        })),
      },
      {
        key: "anuncioId",
        label: "Anuncio",
        type: "select",
        searchable: true,
        placeholder: "Todos",
        searchPlaceholder: "Buscar anuncio...",
        options: (anunciosQuery.data ?? []).map((anuncio: ReferenciaNombrada) => ({
          value: anuncio.id,
          label: anuncio.nombre,
        })),
      },
      {
        key: "metaPaginaId",
        label: "Página",
        type: "select",
        searchable: true,
        placeholder: "Todas",
        searchPlaceholder: "Buscar página...",
        options: (paginasQuery.data ?? []).map((pagina: ReferenciaNombrada) => ({
          value: pagina.id,
          label: pagina.nombre,
        })),
      },
      {
        key: "metaCuentaId",
        label: "Cuenta publicitaria",
        type: "select",
        searchable: true,
        placeholder: "Todas",
        searchPlaceholder: "Buscar cuenta...",
        options: (cuentasQuery.data ?? []).map((cuenta: ReferenciaNombrada) => ({
          value: cuenta.id,
          label: cuenta.nombre,
        })),
      },
      { key: "formularioId", label: "Formulario", type: "text", placeholder: "ID Meta del formulario" },
      { key: "fechaDesde", label: "Desde", type: "date" },
      { key: "fechaHasta", label: "Hasta", type: "date" },
    ],
    [campanasQuery.data, anunciosQuery.data, paginasQuery.data, cuentasQuery.data],
  );

  return (
    <div>
      <PageHeader title="Leads" description="Contactos captados desde formularios de Meta.">
        <DynamicFilters
          fields={fields}
          values={values}
          onChange={(next) => {
            setValues(next);
            setPage(1);
          }}
        />
      </PageHeader>

      {(campanasQuery.isError || anunciosQuery.isError || paginasQuery.isError || cuentasQuery.isError) && (
        <div className="mb-4 space-y-2">
          {campanasQuery.isError && <QueryError error={campanasQuery.error} />}
          {anunciosQuery.isError && <QueryError error={anunciosQuery.error} />}
          {paginasQuery.isError && <QueryError error={paginasQuery.error} />}
          {cuentasQuery.isError && <QueryError error={cuentasQuery.error} />}
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
              {(leadsQuery.data?.data ?? []).map((lead: LeadResumen) => {
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

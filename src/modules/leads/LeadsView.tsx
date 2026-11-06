"use client";

import AsignadoInactivoAviso from "@/src/components/ui/AsignadoInactivoAviso";
import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import EmptyState from "@/src/components/ui/EmptyState";
import DynamicFilters from "@/src/components/ui/filters/DynamicFilters";
import type { DynamicFilterFieldDef, DynamicFilterValues } from "@/src/components/ui/filters/types";
import { Icon } from "@/src/components/ui/Icon";
import MobileCard from "@/src/components/ui/MobileCard";
import PageHeader from "@/src/components/ui/PageHeader";
import Pagination from "@/src/components/ui/Pagination";
import { QueryError } from "@/src/components/ui/PageLoader";
import { TablePageSkeleton } from "@/src/components/ui/skeletons";
import TableAction from "@/src/components/ui/TableAction";
import TableCard, { tdClass, tdPrimaryClass, thClass, thClassEnd } from "@/src/components/ui/TableCard";
import { queryKeys } from "@/src/lib/query/keys";
import { aplicarCascadaFiltros, CASCADA_META_LEADS } from "@/src/components/ui/filters/cascadeFilters";
import LeadAssignmentActions from "./LeadAssignmentActions";
import {
  getAnunciosFiltro,
  getAsignables,
  getCampanasFiltro,
  getCuentasFiltro,
  getFormulariosFiltro,
  getLeads,
  getPaginasFiltro,
} from "./queries";
import type { AnuncioFiltroOpcion, CampanaFiltroOpcion, LeadResumen, ReferenciaNombrada } from "./types";
import EstadoPipelineBadge from "./EstadoPipelineBadge";
import OrigenLeadBadge from "./OrigenLeadBadge";
import { ETIQUETA_TIPO_LEAD } from "./pipeline";
import { usePermisos } from "@/src/context/PermisosContext";


function formatearFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" });
}

function LeadMobileCard({
  lead,
}: {
  lead: LeadResumen;
}) {
  const nombre = lead.nombre ?? "Sin nombre";
  const texto = (value: string | null | undefined) => {
    const t = value?.trim() || "—";
    return (
      <span className="min-w-0 truncate" title={t}>
        {t}
      </span>
    );
  };

  return (
    <MobileCard
      header={<EntityCell name={nombre} subtitle={lead.email ?? "Sin email"} icon="mdi:account-outline" size="md" />}
      aside={
        <>
          <OrigenLeadBadge origen={lead.origen} />
          {lead.tipoLead ? (
            <span className="text-theme-xs text-gray-400">{ETIQUETA_TIPO_LEAD[lead.tipoLead] ?? lead.tipoLead}</span>
          ) : null}
          <EstadoPipelineBadge tipoLead={lead.tipoLead} estado={lead.estadoGestion} />
        </>
      }
      fields={[
        { label: "Teléfono", value: texto(lead.telefono) },
        ...(lead.inmuebleInteres
          ? [
              {
                label: "Inmueble",
                value: texto(`${lead.inmuebleInteres.codigo} · ${lead.inmuebleInteres.titulo}`),
              },
            ]
          : []),
        { label: "Campaña", value: texto(lead.campana?.nombre) },
        { label: "Anuncio", value: texto(lead.anuncio?.nombre) },
        {
          label: "Asignado",
          value: lead.asignado ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              {texto(lead.asignado.nombre)}
              <AsignadoInactivoAviso asignado={lead.asignado} />
            </span>
          ) : (
            <span className="text-warning-500">Sin asignar</span>
          ),
        },
        { label: "Fecha", value: texto(formatearFecha(lead.fechaLead)) },
      ]}
      actions={
        <>
          <LeadAssignmentActions leadId={lead.id} asignado={lead.asignado} />
          <TableAction href={`/leads/${lead.id}`} icon="mdi:eye-outline" label={`Ver ${nombre}`} />
        </>
      }
    />
  );
}

function CeldaConIcono({
  icon,
  value,
  fallback = "—",
  className = "",
}: {
  icon: string;
  value: string | null | undefined;
  fallback?: string;
  className?: string;
}) {
  const texto = value?.trim() || fallback;
  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      <Icon name={icon} size={16} className="shrink-0 text-gray-400" />
      <span className="truncate" title={texto}>
        {texto}
      </span>
    </span>
  );
}

export default function LeadsView({ usuarioId }: { usuarioId: string }) {
  const searchParams = useSearchParams();
  const puede = usePermisos();
  const esAdmin = puede("leads.ver_todos");
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
    asignado: values.asignado || undefined,
    tipoLead: values.tipoLead || undefined,
    estadoGestion: values.estadoGestion || undefined,
    page,
  };

  const campanasQuery = useQuery({ queryKey: queryKeys.metaCampaigns, queryFn: () => getCampanasFiltro() });
  const anunciosQuery = useQuery({ queryKey: queryKeys.metaAds, queryFn: () => getAnunciosFiltro() });
  const paginasQuery = useQuery({ queryKey: queryKeys.metaPagesFiltro, queryFn: () => getPaginasFiltro() });
  const cuentasQuery = useQuery({ queryKey: queryKeys.metaAdAccountsFiltro, queryFn: () => getCuentasFiltro() });
  const formulariosQuery = useQuery({
    queryKey: queryKeys.metaFormsFiltro(values.metaPaginaId),
    queryFn: () => getFormulariosFiltro(values.metaPaginaId || undefined),
  });
  const asignablesQuery = useQuery({
    queryKey: queryKeys.leadsAsignables,
    queryFn: getAsignables,
    enabled: esAdmin,
  });
  const leadsQuery = useQuery({ queryKey: queryKeys.leads(filtro), queryFn: () => getLeads(filtro) });

  const campanasFiltradas = useMemo(() => {
    const todas = (campanasQuery.data ?? []) as CampanaFiltroOpcion[];
    if (!values.metaCuentaId) return todas;
    return todas.filter((c) => c.metaCuentaPublicitariaId === values.metaCuentaId);
  }, [campanasQuery.data, values.metaCuentaId]);

  const anunciosFiltrados = useMemo(() => {
    const todos = (anunciosQuery.data ?? []) as AnuncioFiltroOpcion[];
    const campanaIds = new Set(campanasFiltradas.map((c) => c.id));
    return todos.filter((anuncio) => {
      if (values.campanaId) {
        return anuncio.campanaId ? anuncio.campanaId === values.campanaId : false;
      }
      if (values.metaCuentaId) {
        return anuncio.campanaId ? campanaIds.has(anuncio.campanaId) : false;
      }
      return true;
    });
  }, [anunciosQuery.data, campanasFiltradas, values.campanaId, values.metaCuentaId]);

  const fields = useMemo<DynamicFilterFieldDef[]>(
    () => [
      { key: "q", label: "Buscar", type: "text", placeholder: "Nombre, email o teléfono" },
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
      {
        key: "campanaId",
        label: "Campaña",
        type: "select",
        searchable: true,
        placeholder: "Todas",
        searchPlaceholder: "Buscar campaña...",
        options: campanasFiltradas.map((campana) => ({
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
        options: anunciosFiltrados.map((anuncio) => ({
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
        key: "formularioId",
        label: "Formulario",
        type: "select",
        searchable: true,
        placeholder: "Todos",
        searchPlaceholder: "Buscar formulario...",
        options: (formulariosQuery.data ?? []).map((formulario: ReferenciaNombrada) => ({
          value: formulario.id,
          label: formulario.nombre,
        })),
      },
      { key: "fechaDesde", label: "Desde", type: "date" },
      { key: "fechaHasta", label: "Hasta", type: "date" },
      {
        key: "tipoLead",
        label: "Tipo",
        type: "select",
        placeholder: "Todos",
        options: [
          { value: "COMPRA", label: "Compra" },
          { value: "VENTA", label: "Venta" },
          { value: "OTRO", label: "Otro" },
        ],
      },
      {
        key: "estadoGestion",
        label: "Pipeline",
        type: "select",
        placeholder: "Todos",
        options: [
          { value: "ABIERTOS", label: "Abiertos" },
          { value: "CERRADOS", label: "Cerrados" },
        ],
      },
      {
        key: "asignado",
        label: "Asignación",
        type: "select",
        placeholder: "Mis leads y sin asignar",
        options: [
          { value: usuarioId, label: "Mis leads" },
          { value: "sin_asignar", label: "Sin asignar" },
          ...(esAdmin
            ? [
                { value: "", label: "Todos" },
                ...(asignablesQuery.data ?? [])
                  .filter((u: ReferenciaNombrada) => u.id !== usuarioId)
                  .map((u: ReferenciaNombrada) => ({ value: u.id, label: u.nombre })),
              ]
            : []),
        ],
      },
    ],
    [
      campanasFiltradas,
      anunciosFiltrados,
      paginasQuery.data,
      cuentasQuery.data,
      formulariosQuery.data,
      asignablesQuery.data,
      esAdmin,
      usuarioId,
    ],
  );

  return (
    <div data-tour="leads-page">
      <PageHeader
        title="Leads"
        description="Contactos captados desde Meta, WhatsApp o registrados manualmente."
        action={{ href: "/leads/tablero", label: "Tablero", icon: "mdi:view-column-outline" }}
      >
        <DynamicFilters
          fields={fields}
          values={values}
          onChange={(next) => {
            setValues((prev) => aplicarCascadaFiltros(prev, next, CASCADA_META_LEADS));
            setPage(1);
          }}
        />
      </PageHeader>

      {(campanasQuery.isError ||
        anunciosQuery.isError ||
        paginasQuery.isError ||
        cuentasQuery.isError ||
        formulariosQuery.isError) && (
        <div className="mb-4 space-y-2">
          {campanasQuery.isError && <QueryError error={campanasQuery.error} />}
          {anunciosQuery.isError && <QueryError error={anunciosQuery.error} />}
          {paginasQuery.isError && <QueryError error={paginasQuery.error} />}
          {cuentasQuery.isError && <QueryError error={cuentasQuery.error} />}
          {formulariosQuery.isError && <QueryError error={formulariosQuery.error} />}
        </div>
      )}

      {leadsQuery.isLoading ? (
        <TablePageSkeleton cols={7} />
      ) : leadsQuery.isError ? (
        <QueryError error={leadsQuery.error} />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {leadsQuery.data?.data.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <EmptyState
                  icon="mdi:account-search-outline"
                  title="No hay leads con estos filtros"
                  description="Prueba a cambiar la búsqueda, sincronizar desde Meta o ampliar el rango de fechas."
                />
              </div>
            ) : (
              (leadsQuery.data?.data ?? []).map((lead: LeadResumen) => (
                <LeadMobileCard key={lead.id} lead={lead} />
              ))
            )}
          </div>

          <div className="hidden md:block">
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
          <Table className="w-full table-fixed">
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={`${thClass} w-[18%]`}>
                  Contacto
                </TableCell>
                <TableCell isHeader className={`${thClass} w-[10%]`}>
                  Teléfono
                </TableCell>
                <TableCell isHeader className={`${thClass} w-[13%]`}>
                  Campaña
                </TableCell>
                <TableCell isHeader className={`${thClass} w-[13%]`}>
                  Anuncio
                </TableCell>
                <TableCell isHeader className={`${thClass} w-[11%]`}>
                  Estado
                </TableCell>
                <TableCell isHeader className={`${thClass} w-[12%]`}>
                  Asignado
                </TableCell>
                <TableCell isHeader className={`${thClass} w-[9%]`}>
                  Fecha
                </TableCell>
                <TableCell isHeader className={`${thClassEnd} w-[14%]`}>
                  Acción
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {leadsQuery.data?.data.length === 0 && (
                <EmptyState
                  colSpan={8}
                  icon="mdi:account-search-outline"
                  title="No hay leads con estos filtros"
                  description="Prueba a cambiar la búsqueda, sincronizar desde Meta o ampliar el rango de fechas."
                />
              )}
              {(leadsQuery.data?.data ?? []).map((lead: LeadResumen) => {
                const nombre = lead.nombre ?? "Sin nombre";
                return (
                  <TableRow key={lead.id}>
                    <TableCell className={`${tdPrimaryClass} min-w-0`}>
                      <EntityCell name={nombre} subtitle={lead.email ?? "Sin email"} icon="mdi:account-outline" size="sm" />
                    </TableCell>
                    <TableCell className={`${tdClass} min-w-0`}>
                      <CeldaConIcono icon="mdi:phone-outline" value={lead.telefono} className="text-gray-600 dark:text-gray-300" />
                    </TableCell>
                    <TableCell className={`${tdClass} min-w-0`}>
                      <CeldaConIcono icon="mdi:bullhorn-outline" value={lead.campana?.nombre} />
                    </TableCell>
                    <TableCell className={`${tdClass} min-w-0`}>
                      <CeldaConIcono icon="mdi:image-outline" value={lead.anuncio?.nombre} />
                    </TableCell>
                    <TableCell className={`${tdClass} min-w-0`}>
                      <div className="flex flex-col gap-1">
                        <OrigenLeadBadge origen={lead.origen} />
                        {lead.tipoLead && (
                          <span className="text-theme-xs text-gray-400">
                            {ETIQUETA_TIPO_LEAD[lead.tipoLead] ?? lead.tipoLead}
                          </span>
                        )}
                        <EstadoPipelineBadge tipoLead={lead.tipoLead} estado={lead.estadoGestion} />
                      </div>
                    </TableCell>
                    <TableCell className={`${tdClass} min-w-0`}>
                      {lead.asignado ? (
                        <span className="inline-flex items-center gap-1">
              <CeldaConIcono icon="mdi:account-check-outline" value={lead.asignado.nombre} />
              <AsignadoInactivoAviso asignado={lead.asignado} />
            </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-theme-sm text-warning-500">
                          <Icon name="mdi:account-question-outline" size={16} className="shrink-0" />
                          Sin asignar
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={`${tdClass} min-w-0`}>
                      <CeldaConIcono
                        icon="mdi:calendar-clock-outline"
                        value={formatearFecha(lead.fechaLead)}
                        className="text-gray-600 dark:text-gray-300"
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <LeadAssignmentActions leadId={lead.id} asignado={lead.asignado} />
                        <TableAction href={`/leads/${lead.id}`} icon="mdi:eye-outline" label={`Ver ${nombre}`} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
          </div>

          {leadsQuery.data ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 px-5 py-5 dark:border-gray-800 dark:bg-white/[0.02] md:hidden">
              <Pagination
                page={leadsQuery.data.page}
                pageSize={leadsQuery.data.pageSize}
                total={leadsQuery.data.total}
                totalPages={leadsQuery.data.totalPages}
                onPageChange={setPage}
                itemLabel="leads"
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import DynamicFilters from "@/src/components/ui/filters/DynamicFilters";
import type { DynamicFilterFieldDef, DynamicFilterValues } from "@/src/components/ui/filters/types";
import LineChart from "@/src/components/charts/LineChart";
import BarChart from "@/src/components/charts/BarChart";
import { queryKeys } from "@/src/lib/query/keys";
import { canManageOrganization } from "@/src/lib/roles";
import {
  getCampanasFiltro,
  getAnunciosFiltro,
  getConjuntosAnunciosFiltro,
  getCuentasFiltro,
  getAsignables,
} from "@/src/modules/leads/queries";
import { aplicarCascadaFiltros, CASCADA_META_ADS } from "@/src/components/ui/filters/cascadeFilters";
import type { AnuncioFiltroOpcion, CampanaFiltroOpcion, ConjuntoAnuncioFiltroOpcion, ReferenciaNombrada } from "@/src/modules/leads/types";
import KpiCard from "./KpiCard";
import {
  getDashboardAdsKpis,
  getDashboardAdsSeries,
  getDashboardEmbudoKpis,
  getDashboardKpis,
  getDashboardSeries,
} from "./queries";
import type {
  DashboardKpis,
  DashboardSeries,
  EmbudoKpis,
  FiltroDashboard,
  KpisPublicitarios,
  SeriesPublicitarias,
} from "./types";

type Rol = "PROPIETARIO" | "ADMINISTRADOR" | "USUARIO" | null;

function formatearFechaCorta(fechaYYYYMMDD: string) {
  const [, mes, dia] = fechaYYYYMMDD.split("-");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${dia} ${meses[Number(mes) - 1]}`;
}

function formatearMonto(valor: number | null, moneda: string | null) {
  if (valor === null) return "—";
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda ?? "USD" }).format(valor);
  } catch {
    return valor.toFixed(2);
  }
}

function formatearPorcentaje(ratio: number | null) {
  if (ratio === null) return "—";
  return `${(ratio * 100).toFixed(1)}%`;
}

function formatearHoras(horas: number | null) {
  if (horas === null) return "—";
  if (horas < 24) return `${horas.toFixed(1)} h`;
  const dias = horas / 24;
  return `${dias.toFixed(1)} d`;
}

export default function DashboardView({
  rol,
  usuarioId,
}: {
  rol: Rol;
  usuarioId: string;
}) {
  const searchParams = useSearchParams();
  const esAdmin = canManageOrganization(rol);
  const [values, setValues] = useState<DynamicFilterValues>(() => {
    const metaCuentaId = searchParams.get("metaCuentaId");
    const init: DynamicFilterValues = {};
    if (metaCuentaId) init.metaCuentaId = metaCuentaId;
    return init;
  });

  const filtro: FiltroDashboard = {
    campanaId: values.campanaId || undefined,
    conjuntoAnuncioId: values.conjuntoAnuncioId || undefined,
    anuncioId: values.anuncioId || undefined,
    metaCuentaId: values.metaCuentaId || undefined,
    fechaDesde: values.fechaDesde || undefined,
    fechaHasta: values.fechaHasta || undefined,
    tipoLead: values.tipoLead || undefined,
    asignado: values.asignado || undefined,
  };

  const campanasQuery = useQuery<CampanaFiltroOpcion[]>({
    queryKey: queryKeys.metaCampaigns,
    queryFn: () => getCampanasFiltro(),
  });
  const conjuntosQuery = useQuery<ConjuntoAnuncioFiltroOpcion[]>({
    queryKey: queryKeys.metaAdsets,
    queryFn: () => getConjuntosAnunciosFiltro(),
  });
  const anunciosQuery = useQuery<AnuncioFiltroOpcion[]>({
    queryKey: queryKeys.metaAds,
    queryFn: () => getAnunciosFiltro(),
  });
  const cuentasQuery = useQuery<ReferenciaNombrada[]>({
    queryKey: queryKeys.metaAdAccountsFiltro,
    queryFn: () => getCuentasFiltro(),
  });
  const asignablesQuery = useQuery<ReferenciaNombrada[]>({
    queryKey: queryKeys.leadsAsignables,
    queryFn: () => getAsignables(),
    enabled: esAdmin,
  });

  const kpisQuery = useQuery<DashboardKpis>({
    queryKey: ["dashboard", "kpis", filtro],
    queryFn: () => getDashboardKpis(filtro),
  });
  const seriesQuery = useQuery<DashboardSeries>({
    queryKey: ["dashboard", "series", filtro],
    queryFn: () => getDashboardSeries(filtro),
  });
  const adsKpisQuery = useQuery<KpisPublicitarios>({
    queryKey: ["dashboard", "ads-kpis", filtro],
    queryFn: () => getDashboardAdsKpis(filtro),
  });
  const adsSeriesQuery = useQuery<SeriesPublicitarias>({
    queryKey: ["dashboard", "ads-series", filtro],
    queryFn: () => getDashboardAdsSeries(filtro),
  });
  const embudoQuery = useQuery<EmbudoKpis>({
    queryKey: ["dashboard", "embudo-kpis", filtro],
    queryFn: () => getDashboardEmbudoKpis(filtro),
  });

  const campanasData: CampanaFiltroOpcion[] = campanasQuery.data ?? [];
  const conjuntosData: ConjuntoAnuncioFiltroOpcion[] = conjuntosQuery.data ?? [];
  const anunciosData: AnuncioFiltroOpcion[] = anunciosQuery.data ?? [];
  const cuentasData: ReferenciaNombrada[] = cuentasQuery.data ?? [];
  const asignablesData: ReferenciaNombrada[] = asignablesQuery.data ?? [];
  const seriesData: DashboardSeries | undefined = seriesQuery.data;
  const adsSeriesData: SeriesPublicitarias | undefined = adsSeriesQuery.data;
  const embudoData: EmbudoKpis | undefined = embudoQuery.data;

  const campanasFiltradas = useMemo(() => {
    if (!values.metaCuentaId) return campanasData;
    return campanasData.filter((c) => c.metaCuentaPublicitariaId === values.metaCuentaId);
  }, [campanasData, values.metaCuentaId]);

  const conjuntosFiltrados = useMemo(() => {
    const campanaIds = new Set(campanasFiltradas.map((c) => c.id));
    return conjuntosData.filter((conjunto) => {
      if (values.campanaId) return conjunto.campanaId === values.campanaId;
      if (values.metaCuentaId) return campanaIds.has(conjunto.campanaId);
      return true;
    });
  }, [conjuntosData, campanasFiltradas, values.campanaId, values.metaCuentaId]);

  const anunciosFiltrados = useMemo(() => {
    const conjuntoIds = new Set(conjuntosFiltrados.map((c) => c.id));
    return anunciosData.filter((anuncio) => {
      if (values.conjuntoAnuncioId) return anuncio.conjuntoAnuncioId === values.conjuntoAnuncioId;
      if (values.campanaId) {
        return anuncio.campanaId
          ? anuncio.campanaId === values.campanaId
          : conjuntoIds.has(anuncio.conjuntoAnuncioId);
      }
      if (values.metaCuentaId) return conjuntoIds.has(anuncio.conjuntoAnuncioId);
      return true;
    });
  }, [anunciosData, conjuntosFiltrados, values.conjuntoAnuncioId, values.campanaId, values.metaCuentaId]);

  const fields = useMemo<DynamicFilterFieldDef[]>(
    () => [
      {
        key: "metaCuentaId",
        label: "Cuenta publicitaria",
        type: "select",
        searchable: true,
        placeholder: "Todas",
        searchPlaceholder: "Buscar cuenta...",
        options: cuentasData.map((cuenta) => ({ value: cuenta.id, label: cuenta.nombre })),
      },
      {
        key: "campanaId",
        label: "Campaña",
        type: "select",
        searchable: true,
        placeholder: "Todas",
        searchPlaceholder: "Buscar campaña...",
        options: campanasFiltradas.map((campana) => ({ value: campana.id, label: campana.nombre })),
      },
      {
        key: "conjuntoAnuncioId",
        label: "Conjunto",
        type: "select",
        searchable: true,
        placeholder: "Todos",
        searchPlaceholder: "Buscar conjunto...",
        options: conjuntosFiltrados.map((conjunto) => ({ value: conjunto.id, label: conjunto.nombre })),
      },
      {
        key: "anuncioId",
        label: "Anuncio",
        type: "select",
        searchable: true,
        placeholder: "Todos",
        searchPlaceholder: "Buscar anuncio...",
        options: anunciosFiltrados.map((anuncio) => ({ value: anuncio.id, label: anuncio.nombre })),
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
        key: "asignado",
        label: "Asignación",
        type: "select",
        placeholder: esAdmin ? "Todos" : "Mis leads y sin asignar",
        options: [
          { value: usuarioId, label: "Mis leads" },
          { value: "sin_asignar", label: "Sin asignar" },
          ...(esAdmin
            ? [
                { value: "mios", label: "Míos y pool" },
                ...asignablesData
                  .filter((u) => u.id !== usuarioId)
                  .map((u) => ({ value: u.id, label: u.nombre })),
              ]
            : []),
        ],
      },
    ],
    [
      cuentasData,
      campanasFiltradas,
      conjuntosFiltrados,
      anunciosFiltrados,
      asignablesData,
      esAdmin,
      usuarioId,
    ],
  );

  const embudoConDatos = embudoData?.porEstado.some((p) => p.total > 0) ?? false;

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen de leads por periodo y campaña.">
        <DynamicFilters
          fields={fields}
          values={values}
          onChange={(next) => setValues((prev) => aplicarCascadaFiltros(prev, next, CASCADA_META_ADS))}
        />
      </PageHeader>

      {(campanasQuery.isError || conjuntosQuery.isError || anunciosQuery.isError || cuentasQuery.isError) && (
        <div className="mb-4 space-y-2">
          {campanasQuery.isError && <QueryError error={campanasQuery.error} />}
          {conjuntosQuery.isError && <QueryError error={conjuntosQuery.error} />}
          {anunciosQuery.isError && <QueryError error={anunciosQuery.error} />}
          {cuentasQuery.isError && <QueryError error={cuentasQuery.error} />}
        </div>
      )}

      {kpisQuery.isLoading ? (
        <PageLoader label="Cargando KPIs…" />
      ) : kpisQuery.isError ? (
        <QueryError error={kpisQuery.error} />
      ) : (
        kpisQuery.data && (
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
            <KpiCard label="Total" value={kpisQuery.data.total} icon="mdi:account-group" />
            <KpiCard label="Hoy" value={kpisQuery.data.hoy} icon="mdi:calendar-today" />
            <KpiCard label="Esta semana" value={kpisQuery.data.semana} icon="mdi:calendar-week" />
            <KpiCard label="Este mes" value={kpisQuery.data.mes} icon="mdi:calendar-month" />
          </div>
        )
      )}

      {embudoQuery.isLoading ? (
        <PageLoader label="Cargando embudo…" />
      ) : embudoQuery.isError ? (
        <QueryError error={embudoQuery.error} />
      ) : (
        embudoData && (
          <section className="mb-6">
            <h2 className="mb-3 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Embudo de gestión</h2>
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
              <KpiCard label="Leads en periodo" value={embudoData.total} icon="mdi:filter-variant" />
              <KpiCard
                label="Tasa de contacto"
                value={formatearPorcentaje(embudoData.tasaContacto)}
                icon="mdi:phone-check-outline"
              />
              <KpiCard
                label="Conversión ganado"
                value={formatearPorcentaje(embudoData.conversionGanado)}
                icon="mdi:trophy-outline"
              />
              <KpiCard label="Cerrados ganados" value={embudoData.cerradosGanados} icon="mdi:check-decagram-outline" />
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Leads por etapa</h3>
                {!embudoConDatos ? (
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin leads en el rango seleccionado.</p>
                ) : (
                  <BarChart
                    categories={embudoData.porEstado.map((p) => p.etiqueta)}
                    data={embudoData.porEstado.map((p) => p.total)}
                    seriesName="Leads"
                    height={260}
                  />
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Tiempo promedio en etapa</h3>
                {!embudoConDatos ? (
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin datos de historial en el rango.</p>
                ) : (
                  <ul className="max-h-[260px] space-y-1.5 overflow-y-auto">
                    {embudoData.porEstado
                      .filter((p) => p.total > 0 || p.horasPromedio !== null)
                      .map((p) => (
                        <li
                          key={p.estadoGestion}
                          className="flex items-center justify-between gap-2 text-theme-sm text-gray-700 dark:text-gray-300"
                        >
                          <span className="truncate">{p.etiqueta}</span>
                          <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                            {formatearHoras(p.horasPromedio)}
                            {p.total > 0 ? (
                              <span className="ml-2 text-theme-xs text-gray-400">({p.total})</span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>

            {embudoData.porTipoLead.length > 1 && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {embudoData.porTipoLead.map((t) => (
                  <div
                    key={t.tipoLead ?? "null"}
                    className="rounded-xl border border-gray-200 bg-white px-3.5 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
                  >
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">{t.etiquetaTipo}</p>
                    <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                      {t.total.toLocaleString("es-PE")} leads
                    </p>
                    <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                      Contacto {formatearPorcentaje(t.tasaContacto)} · Ganado {formatearPorcentaje(t.conversionGanado)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      )}

      {adsKpisQuery.isLoading ? (
        <PageLoader label="Cargando métricas de anuncios…" />
      ) : adsKpisQuery.isError ? (
        <QueryError error={adsKpisQuery.error} />
      ) : (
        adsKpisQuery.data &&
        (adsKpisQuery.data.spend === null ? (
          <p className="mb-6 text-theme-sm text-gray-500 dark:text-gray-400">
            Sin datos de inversión para conjunto/anuncio — Insights solo se sincroniza a nivel cuenta o campaña.
          </p>
        ) : adsKpisQuery.data.spend === 0 && adsKpisQuery.data.impressions === 0 ? (
          <p className="mb-6 text-theme-sm text-gray-500 dark:text-gray-400">
            Sin métricas Meta sincronizadas en este periodo — sincroniza desde el perfil de la cuenta publicitaria.
          </p>
        ) : (
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
            <KpiCard
              label="Inversión"
              value={formatearMonto(adsKpisQuery.data.spend, adsKpisQuery.data.moneda)}
              icon="mdi:cash-multiple"
            />
            <KpiCard label="CTR" value={adsKpisQuery.data.ctr !== null ? `${adsKpisQuery.data.ctr.toFixed(2)}%` : "—"} icon="mdi:cursor-default-click-outline" />
            <KpiCard
              label="CPC"
              value={formatearMonto(adsKpisQuery.data.cpc, adsKpisQuery.data.moneda)}
              icon="mdi:mouse-outline"
            />
            <KpiCard
              label="CPL"
              value={formatearMonto(adsKpisQuery.data.cpl, adsKpisQuery.data.moneda)}
              icon="mdi:account-cash-outline"
            />
          </div>
        ))
      )}

      {seriesQuery.isLoading ? (
        <PageLoader label="Cargando gráficos…" />
      ) : seriesQuery.isError ? (
        <QueryError error={seriesQuery.error} />
      ) : (
        seriesData && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
              <h2 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Leads por día</h2>
              {seriesData.porDia.every((p) => p.total === 0) ? (
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin leads en el rango seleccionado.</p>
              ) : (
                <LineChart
                  categories={seriesData.porDia.map((p) => formatearFechaCorta(p.fecha))}
                  data={seriesData.porDia.map((p) => p.total)}
                />
              )}
            </div>

            {adsSeriesData && adsSeriesData.porDia.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
                <h2 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                  {adsSeriesData.porCuenta && adsSeriesData.porCuenta.length > 1
                    ? "Inversión por día (por cuenta)"
                    : "Inversión por día"}
                </h2>
                {adsSeriesData.porDia.every((p) => p.spend === 0) ? (
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin inversión sincronizada en el rango seleccionado.</p>
                ) : adsSeriesData.porCuenta && adsSeriesData.porCuenta.length > 1 ? (
                  <LineChart
                    categories={adsSeriesData.porDia.map((p) => formatearFechaCorta(p.fecha))}
                    series={[
                      {
                        name: "Total",
                        data: adsSeriesData.porDia.map((p) => p.spend),
                      },
                      ...adsSeriesData.porCuenta.map((cuenta) => ({
                        name: cuenta.nombre,
                        data: cuenta.porDia.map((p) => p.spend),
                      })),
                    ]}
                  />
                ) : (
                  <LineChart
                    categories={adsSeriesData.porDia.map((p) => formatearFechaCorta(p.fecha))}
                    data={adsSeriesData.porDia.map((p) => p.spend)}
                    seriesName="Inversión"
                  />
                )}
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Leads por campaña</h2>
              {seriesData.porCampana.length === 0 ? (
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin datos en el rango seleccionado.</p>
              ) : (
                <BarChart
                  categories={seriesData.porCampana.map((p) => p.nombre)}
                  data={seriesData.porCampana.map((p) => p.total)}
                />
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-2 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Leads por anuncio</h2>
              {seriesData.porAnuncio.length === 0 ? (
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin datos en el rango seleccionado.</p>
              ) : (
                <BarChart
                  categories={seriesData.porAnuncio.map((p) => p.nombre)}
                  data={seriesData.porAnuncio.map((p) => p.total)}
                />
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

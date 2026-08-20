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
import { getCampanasFiltro, getAnunciosFiltro } from "@/src/modules/leads/queries";
import KpiCard from "./KpiCard";
import {
  getConjuntosAnunciosFiltro,
  getCuentasFiltro,
  getDashboardAdsKpis,
  getDashboardAdsSeries,
  getDashboardKpis,
  getDashboardSeries,
} from "./queries";
import type { FiltroDashboard } from "./types";

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

export default function DashboardView() {
  const searchParams = useSearchParams();
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
  };

  const campanasQuery = useQuery({ queryKey: queryKeys.metaCampaigns, queryFn: () => getCampanasFiltro() });
  const conjuntosQuery = useQuery({ queryKey: queryKeys.metaAdsets, queryFn: () => getConjuntosAnunciosFiltro() });
  const anunciosQuery = useQuery({ queryKey: queryKeys.metaAds, queryFn: () => getAnunciosFiltro() });
  const cuentasQuery = useQuery({ queryKey: queryKeys.metaAdAccountsFiltro, queryFn: () => getCuentasFiltro() });

  const kpisQuery = useQuery({ queryKey: ["dashboard", "kpis", filtro], queryFn: () => getDashboardKpis(filtro) });
  const seriesQuery = useQuery({ queryKey: ["dashboard", "series", filtro], queryFn: () => getDashboardSeries(filtro) });
  const adsKpisQuery = useQuery({
    queryKey: ["dashboard", "ads-kpis", filtro],
    queryFn: () => getDashboardAdsKpis(filtro),
  });
  const adsSeriesQuery = useQuery({
    queryKey: ["dashboard", "ads-series", filtro],
    queryFn: () => getDashboardAdsSeries(filtro),
  });

  const fields = useMemo<DynamicFilterFieldDef[]>(
    () => [
      {
        key: "campanaId",
        label: "Campaña",
        type: "select",
        searchable: true,
        placeholder: "Todas",
        searchPlaceholder: "Buscar campaña...",
        options: (campanasQuery.data ?? []).map((campana) => ({ value: campana.id, label: campana.nombre })),
      },
      {
        key: "conjuntoAnuncioId",
        label: "Conjunto",
        type: "select",
        searchable: true,
        placeholder: "Todos",
        searchPlaceholder: "Buscar conjunto...",
        options: (conjuntosQuery.data ?? []).map((conjunto) => ({ value: conjunto.id, label: conjunto.nombre })),
      },
      {
        key: "anuncioId",
        label: "Anuncio",
        type: "select",
        searchable: true,
        placeholder: "Todos",
        searchPlaceholder: "Buscar anuncio...",
        options: (anunciosQuery.data ?? []).map((anuncio) => ({ value: anuncio.id, label: anuncio.nombre })),
      },
      {
        key: "metaCuentaId",
        label: "Cuenta publicitaria",
        type: "select",
        searchable: true,
        placeholder: "Todas",
        searchPlaceholder: "Buscar cuenta...",
        options: (cuentasQuery.data ?? []).map((cuenta) => ({ value: cuenta.id, label: cuenta.nombre })),
      },
      { key: "fechaDesde", label: "Desde", type: "date" },
      { key: "fechaHasta", label: "Hasta", type: "date" },
    ],
    [campanasQuery.data, conjuntosQuery.data, anunciosQuery.data, cuentasQuery.data],
  );

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen de leads por periodo y campaña.">
        <DynamicFilters fields={fields} values={values} onChange={setValues} />
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
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
            <KpiCard label="Total" value={kpisQuery.data.total} icon="mdi:account-group" />
            <KpiCard label="Hoy" value={kpisQuery.data.hoy} icon="mdi:calendar-today" />
            <KpiCard label="Esta semana" value={kpisQuery.data.semana} icon="mdi:calendar-week" />
            <KpiCard label="Este mes" value={kpisQuery.data.mes} icon="mdi:calendar-month" />
          </div>
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
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
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
        seriesQuery.data && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
              <h2 className="mb-4 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Leads por día</h2>
              {seriesQuery.data.porDia.every((p) => p.total === 0) ? (
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin leads en el rango seleccionado.</p>
              ) : (
                <LineChart
                  categories={seriesQuery.data.porDia.map((p) => formatearFechaCorta(p.fecha))}
                  data={seriesQuery.data.porDia.map((p) => p.total)}
                />
              )}
            </div>

            {adsSeriesQuery.data && adsSeriesQuery.data.porDia.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
                <h2 className="mb-4 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Inversión por día</h2>
                {adsSeriesQuery.data.porDia.every((p) => p.spend === 0) ? (
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin inversión sincronizada en el rango seleccionado.</p>
                ) : (
                  <LineChart
                    categories={adsSeriesQuery.data.porDia.map((p) => formatearFechaCorta(p.fecha))}
                    data={adsSeriesQuery.data.porDia.map((p) => p.spend)}
                  />
                )}
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-4 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Leads por campaña</h2>
              {seriesQuery.data.porCampana.length === 0 ? (
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin datos en el rango seleccionado.</p>
              ) : (
                <BarChart
                  categories={seriesQuery.data.porCampana.map((p) => p.nombre)}
                  data={seriesQuery.data.porCampana.map((p) => p.total)}
                />
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-4 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Leads por anuncio</h2>
              {seriesQuery.data.porAnuncio.length === 0 ? (
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin datos en el rango seleccionado.</p>
              ) : (
                <BarChart
                  categories={seriesQuery.data.porAnuncio.map((p) => p.nombre)}
                  data={seriesQuery.data.porAnuncio.map((p) => p.total)}
                />
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

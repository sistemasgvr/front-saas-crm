"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Select from "@/src/components/form/Select";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import LineChart from "@/src/components/charts/LineChart";
import BarChart from "@/src/components/charts/BarChart";
import { queryKeys } from "@/src/lib/query/keys";
import { getCampanasFiltro, getAnunciosFiltro } from "@/src/modules/leads/queries";
import KpiCard from "./KpiCard";
import { getConjuntosAnunciosFiltro, getDashboardKpis, getDashboardSeries } from "./queries";
import type { FiltroDashboard } from "./types";

function formatearFechaCorta(fechaYYYYMMDD: string) {
  const [, mes, dia] = fechaYYYYMMDD.split("-");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${dia} ${meses[Number(mes) - 1]}`;
}

export default function DashboardView() {
  const [campanaId, setCampanaId] = useState("");
  const [conjuntoAnuncioId, setConjuntoAnuncioId] = useState("");
  const [anuncioId, setAnuncioId] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const filtro: FiltroDashboard = {
    campanaId: campanaId || undefined,
    conjuntoAnuncioId: conjuntoAnuncioId || undefined,
    anuncioId: anuncioId || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  };

  const campanasQuery = useQuery({ queryKey: queryKeys.metaCampaigns, queryFn: () => getCampanasFiltro() });
  const conjuntosQuery = useQuery({ queryKey: queryKeys.metaAdsets, queryFn: () => getConjuntosAnunciosFiltro() });
  const anunciosQuery = useQuery({ queryKey: queryKeys.metaAds, queryFn: () => getAnunciosFiltro() });

  const kpisQuery = useQuery({ queryKey: ["dashboard", "kpis", filtro], queryFn: () => getDashboardKpis(filtro) });
  const seriesQuery = useQuery({ queryKey: ["dashboard", "series", filtro], queryFn: () => getDashboardSeries(filtro) });

  return (
    <div>
      <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">Dashboard</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label>Campaña</Label>
          <Select
            options={(campanasQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            value={campanaId}
            onChange={setCampanaId}
            placeholder="Todas"
          />
        </div>
        <div>
          <Label>Conjunto de anuncios</Label>
          <Select
            options={(conjuntosQuery.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
            value={conjuntoAnuncioId}
            onChange={setConjuntoAnuncioId}
            placeholder="Todos"
          />
        </div>
        <div>
          <Label>Anuncio</Label>
          <Select
            options={(anunciosQuery.data ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
            value={anuncioId}
            onChange={setAnuncioId}
            placeholder="Todos"
          />
        </div>
        <div>
          <Label htmlFor="fechaDesde">Desde</Label>
          <Input id="fechaDesde" type="date" defaultValue={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="fechaHasta">Hasta</Label>
          <Input id="fechaHasta" type="date" defaultValue={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        </div>
      </div>

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

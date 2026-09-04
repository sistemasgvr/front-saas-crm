"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface BarChartProps {
  categories: string[];
  data: number[];
  seriesName?: string;
  height?: number;
  /** Forzar barras horizontales (mejor con nombres largos). */
  horizontal?: boolean;
}

function truncarEtiqueta(texto: string, max: number): string {
  const t = texto.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(1, max - 1))}…`;
}

function formatearEntero(val: number): string {
  if (!Number.isFinite(val)) return "0";
  return Math.round(val).toLocaleString("es-PE");
}

/** Horizontal automático si hay pocas categorías con nombres largos. */
function debeSerHorizontal(categories: string[], forced?: boolean): boolean {
  if (forced !== undefined) return forced;
  if (categories.length === 0) return false;
  const avg = categories.reduce((s, c) => s + c.length, 0) / categories.length;
  const maxLen = Math.max(...categories.map((c) => c.length));
  return maxLen > 22 || (categories.length <= 8 && avg > 14);
}

export default function BarChart({
  categories,
  data,
  seriesName = "Leads",
  height,
  horizontal: horizontalProp,
}: BarChartProps) {
  const horizontal = debeSerHorizontal(categories, horizontalProp);
  const maxLabel = horizontal ? 36 : 14;
  const etiquetas = categories.map((c) => truncarEtiqueta(c, maxLabel));

  const alto =
    height ??
    (horizontal ? Math.min(420, Math.max(200, categories.length * 42 + 48)) : 240);

  const columnWidth = data.length <= 2 ? "28%" : data.length <= 4 ? "40%" : "55%";

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: alto,
      toolbar: { show: false },
      parentHeightOffset: 0,
      animations: { enabled: true, speed: 400 },
    },
    plotOptions: {
      bar: {
        horizontal,
        columnWidth,
        borderRadius: 4,
        borderRadiusApplication: "end",
        barHeight: horizontal ? (categories.length <= 3 ? "48%" : "68%") : undefined,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: horizontal
      ? {
          categories: etiquetas,
          labels: {
            formatter: (val) => formatearEntero(Number(val)),
            style: { fontSize: "11px", colors: ["#6B7280"] },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
          decimalsInFloat: 0,
        }
      : {
          categories: etiquetas,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: {
            rotate: -20,
            rotateAlways: categories.some((c) => c.length > 10),
            hideOverlappingLabels: true,
            trim: true,
            maxHeight: 56,
            style: { fontSize: "11px", colors: ["#6B7280"] },
          },
        },
    yaxis: horizontal
      ? {
          labels: {
            maxWidth: 160,
            style: { fontSize: "11px", colors: ["#6B7280"] },
          },
        }
      : {
          forceNiceScale: true,
          decimalsInFloat: 0,
          labels: {
            formatter: (val) => formatearEntero(val),
            style: { fontSize: "11px", colors: ["#6B7280"] },
          },
        },
    legend: { show: false },
    grid: {
      padding: horizontal
        ? { left: 8, right: 12, top: 8, bottom: 4 }
        : { left: 8, right: 8, top: 12, bottom: 8 },
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    fill: { opacity: 1 },
    tooltip: {
      x: {
        formatter: (_val, opts) => categories[opts?.dataPointIndex ?? 0] ?? "",
      },
      y: { formatter: (val: number) => formatearEntero(val) },
    },
  };

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <ReactApexChart options={options} series={[{ name: seriesName, data }]} type="bar" height={alto} width="100%" />
    </div>
  );
}

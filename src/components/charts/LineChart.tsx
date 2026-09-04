"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const COLORES_SERIES = [
  "#465FFF",
  "#12B76A",
  "#F79009",
  "#EE46BC",
  "#7A5AF8",
  "#0BA5EC",
  "#F04438",
  "#6172F3",
];

export interface LineChartSerie {
  name: string;
  data: number[];
}

interface LineChartProps {
  categories: string[];
  /** Serie única (compatibilidad). Ignorado si se pasa `series`. */
  data?: number[];
  seriesName?: string;
  /** Varias series (p. ej. inversión por cuenta). */
  series?: LineChartSerie[];
  height?: number;
  showLegend?: boolean;
  /** Formato del eje Y / tooltip (default: enteros). */
  valueFormat?: "int" | "money";
}

function formatearValor(val: number, format: "int" | "money"): string {
  if (!Number.isFinite(val)) return "0";
  if (format === "money") {
    return val.toLocaleString("es-PE", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  }
  return Math.round(val).toLocaleString("es-PE");
}

export default function LineChart({
  categories,
  data,
  seriesName = "Leads",
  series,
  height = 240,
  showLegend,
  valueFormat = "int",
}: LineChartProps) {
  const apexSeries: LineChartSerie[] =
    series && series.length > 0
      ? series
      : [{ name: seriesName, data: data ?? [] }];

  const multi = apexSeries.length > 1;
  const legendVisible = showLegend ?? multi;
  const chartHeight = legendVisible ? height + 28 : height;

  const options: ApexOptions = {
    legend: {
      show: legendVisible,
      position: "top",
      horizontalAlign: "left",
      floating: false,
      fontFamily: "Outfit, sans-serif",
      fontSize: "11px",
      markers: { size: 5, strokeWidth: 0 },
      itemMargin: { horizontal: 10, vertical: 4 },
      offsetY: 0,
    },
    colors: COLORES_SERIES.slice(0, Math.max(apexSeries.length, 1)),
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: chartHeight,
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
      parentHeightOffset: 0,
    },
    stroke: {
      show: true,
      curve: "smooth",
      width: 2,
    },
    fill: multi
      ? {
          type: "solid",
          opacity: apexSeries.map((_, i) => (i === 0 ? 0.06 : 0.12)),
        }
      : { type: "gradient", gradient: { opacityFrom: 0.45, opacityTo: 0 } },
    markers: {
      size: multi ? 2 : 0,
      strokeColors: "#fff",
      strokeWidth: 1,
      hover: { size: 4 },
    },
    grid: {
      padding: {
        left: 8,
        right: 12,
        top: legendVisible ? 8 : 12,
        bottom: 4,
      },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      shared: multi,
      intersect: false,
      x: { format: "dd MMM" },
      y: { formatter: (val: number) => formatearValor(val, valueFormat) },
    },
    xaxis: {
      type: "category",
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      labels: {
        hideOverlappingLabels: true,
        style: { fontSize: "11px", colors: ["#6B7280"] },
      },
    },
    yaxis: {
      forceNiceScale: true,
      decimalsInFloat: valueFormat === "money" ? 2 : 0,
      labels: {
        formatter: (val) => formatearValor(val, valueFormat),
        style: { fontSize: "11px", colors: ["#6B7280"] },
        maxWidth: 72,
      },
    },
  };

  return (
    <div className="w-full min-w-0 overflow-hidden pt-1">
      <ReactApexChart options={options} series={apexSeries} type="area" height={chartHeight} width="100%" />
    </div>
  );
}

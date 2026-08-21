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
}

export default function LineChart({
  categories,
  data,
  seriesName = "Leads",
  series,
  height = 220,
  showLegend,
}: LineChartProps) {
  const apexSeries: LineChartSerie[] =
    series && series.length > 0
      ? series
      : [{ name: seriesName, data: data ?? [] }];

  const multi = apexSeries.length > 1;
  const legendVisible = showLegend ?? multi;

  const options: ApexOptions = {
    legend: {
      show: legendVisible,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit, sans-serif",
      fontSize: "11px",
      markers: { size: 5, strokeWidth: 0 },
      itemMargin: { horizontal: 8, vertical: 0 },
      height: 28,
    },
    colors: COLORES_SERIES.slice(0, Math.max(apexSeries.length, 1)),
    chart: {
      fontFamily: "Outfit, sans-serif",
      height,
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
      padding: { left: 4, right: 4, top: -8, bottom: 0 },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: { enabled: true, shared: multi, intersect: false, x: { format: "dd MMM" } },
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
    yaxis: { labels: { style: { fontSize: "11px", colors: ["#6B7280"] } } },
  };

  return (
    <div className="w-full overflow-hidden">
      <ReactApexChart options={options} series={apexSeries} type="area" height={height} width="100%" />
    </div>
  );
}

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
  height = 280,
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
      fontSize: "12px",
      markers: { size: 6, strokeWidth: 0 },
      itemMargin: { horizontal: 12, vertical: 4 },
    },
    colors: COLORES_SERIES.slice(0, Math.max(apexSeries.length, 1)),
    chart: {
      fontFamily: "Outfit, sans-serif",
      height,
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
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
      size: multi ? 3 : 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 5 },
    },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: { enabled: true, shared: multi, intersect: false, x: { format: "dd MMM" } },
    xaxis: {
      type: "category",
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { style: { fontSize: "12px", colors: ["#6B7280"] } } },
  };

  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <ReactApexChart options={options} series={apexSeries} type="area" height={height} />
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface BarChartProps {
  categories: string[];
  data: number[];
  seriesName?: string;
  height?: number;
}

function truncarEtiqueta(texto: string, max = 18): string {
  const t = texto.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export default function BarChart({ categories, data, seriesName = "Leads", height = 220 }: BarChartProps) {
  const etiquetas = categories.map((c) => truncarEtiqueta(c));
  const columnWidth = data.length <= 2 ? "28%" : data.length <= 4 ? "40%" : "55%";

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height,
      toolbar: { show: false },
      parentHeightOffset: 0,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth,
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: etiquetas,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: categories.some((c) => c.length > 12) ? -35 : 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
        trim: true,
        maxHeight: 48,
        style: { fontSize: "11px", colors: ["#6B7280"] },
      },
    },
    legend: { show: false },
    yaxis: {
      title: { text: undefined },
      labels: { style: { fontSize: "11px", colors: ["#6B7280"] } },
    },
    grid: {
      padding: { left: 4, right: 4, top: -8, bottom: 0 },
      yaxis: { lines: { show: true } },
    },
    fill: { opacity: 1 },
    tooltip: {
      x: {
        formatter: (_val, opts) => categories[opts?.dataPointIndex ?? 0] ?? "",
      },
      y: { formatter: (val: number) => `${val}` },
    },
  };

  return (
    <div className="w-full overflow-hidden">
      <ReactApexChart options={options} series={[{ name: seriesName, data }]} type="bar" height={height} width="100%" />
    </div>
  );
}

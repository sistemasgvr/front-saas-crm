"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface LineChartProps {
  categories: string[];
  data: number[];
  seriesName?: string;
  height?: number;
}

export default function LineChart({ categories, data, seriesName = "Leads", height = 280 }: LineChartProps) {
  const options: ApexOptions = {
    legend: { show: false },
    colors: ["#465FFF"],
    chart: { fontFamily: "Outfit, sans-serif", height, type: "line", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.45, opacityTo: 0 } },
    markers: { size: 0, strokeColors: "#fff", strokeWidth: 2, hover: { size: 5 } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: { enabled: true, x: { format: "dd MMM" } },
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
      <ReactApexChart options={options} series={[{ name: seriesName, data }]} type="area" height={height} />
    </div>
  );
}

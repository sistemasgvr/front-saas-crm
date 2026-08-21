import { Icon } from "@/src/components/ui/Icon";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: string;
}

export default function KpiCard({ label, value, icon }: KpiCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <Icon name={icon} size={18} className="text-gray-700 dark:text-white/90" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="truncate text-theme-sm font-semibold text-gray-800 dark:text-white/90">
          {typeof value === "number" ? value.toLocaleString("es-PE") : value}
        </p>
      </div>
    </div>
  );
}

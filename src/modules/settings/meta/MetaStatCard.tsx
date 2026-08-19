import { Icon } from "@/src/components/ui/Icon";

interface MetaStatCardProps {
  label: string;
  value: string | number;
  icon: string;
}

export default function MetaStatCard({ label, value, icon }: MetaStatCardProps) {
  const display = typeof value === "number" ? value.toLocaleString("es-PE") : value;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        <Icon name={icon} size={24} className="text-gray-800 dark:text-white/90" />
      </div>
      <div className="mt-5">
        <span className="text-theme-sm text-gray-500 dark:text-gray-400">{label}</span>
        <p className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">{display}</p>
      </div>
    </div>
  );
}

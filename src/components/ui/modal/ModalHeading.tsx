import { Icon } from "@/src/components/ui/Icon";

export default function ModalHeading({ title, icon, danger = false }: {
  title: string;
  icon: string;
  danger?: boolean;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 py-4 pl-5 pr-16">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${danger ? "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400" : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"}`}>
        <Icon name={icon} size={20} />
      </span>
      <h2 className="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">{title}</h2>
    </div>
  );
}

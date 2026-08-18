import type { ReactNode } from "react";

interface TableCardProps {
  children: ReactNode;
  footer?: ReactNode;
}

export default function TableCard({ children, footer }: TableCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">{children}</div>
      {footer ? (
        <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-5 dark:border-gray-800 dark:bg-white/[0.02]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export const thClass =
  "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";
export const thClassEnd =
  "px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400";
export const tdClass = "px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400";
export const tdPrimaryClass = "px-5 py-4 text-start";

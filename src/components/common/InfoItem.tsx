import type { ReactNode } from "react";

/**
 * Pares etiqueta/valor — copia de user-profile/UserInfoCard del template
 * TailAdmin. Envuelve varios `InfoItem` en `InfoGrid`.
 */
export function InfoGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">{children}</div>;
}

export function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">{label}</p>
      <div className="text-sm font-medium text-gray-800 break-words dark:text-white/90">{children}</div>
    </div>
  );
}

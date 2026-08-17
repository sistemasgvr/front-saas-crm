"use client";

import { Spinner } from "@/src/components/ui/Spinner";

export function PageLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3" role="status">
      <Spinner size={32} className="text-brand-500" />
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export function QueryError({ error }: { error: unknown }) {
  return (
    <p className="text-sm text-error-500" role="alert">
      {error instanceof Error ? error.message : "No se pudo cargar la información"}
    </p>
  );
}

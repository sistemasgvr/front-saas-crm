"use client";

import { Spinner } from "@/src/components/ui/Spinner";
import { ModuleForbidden } from "@/src/components/ui/ModuleForbidden";
import { Icon } from "@/src/components/ui/Icon";

function isForbiddenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("no está habilitado") || message.includes("403");
}

function statusDeError(error: unknown): number {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status;
    return typeof status === "number" ? status : 0;
  }
  return 0;
}

/** Mensaje amigable: nunca mostrar "Internal Server Error" crudo al usuario. */
export function mensajeErrorConsulta(error: unknown): string {
  if (!(error instanceof Error)) return "No se pudo cargar la información";

  const raw = error.message.trim();
  const status = statusDeError(error);
  const generico =
    !raw ||
    /^internal\s*server\s*error$/i.test(raw) ||
    /^error$/i.test(raw) ||
    status >= 500;

  if (generico) {
    return "Algo falló al cargar. Espera un momento e intenta de nuevo.";
  }
  return raw;
}

export function PageLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3" role="status">
      <Spinner size={32} className="text-brand-500" />
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export function QueryError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  if (isForbiddenError(error)) {
    return <ModuleForbidden message={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center"
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-500/10">
        <Icon name="mdi:alert-circle-outline" size={24} />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
          No se pudo cargar
        </p>
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
          {mensajeErrorConsulta(error)}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-theme-sm font-medium text-white transition hover:bg-brand-600"
        >
          <Icon name="mdi:refresh" size={16} />
          Reintentar
        </button>
      )}
    </div>
  );
}

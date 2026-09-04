"use client";

import { Icon } from "@/src/components/ui/Icon";
import { mensajeErrorConsulta } from "@/src/components/ui/PageLoader";

function esErrorRed(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes("no se pudo conectar") ||
    msg.includes("no respondió a tiempo") ||
    msg.includes("servidor")
  );
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const red = esErrorRed(error);

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          red
            ? "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
            : "bg-error-50 text-error-500 dark:bg-error-500/10"
        }`}
      >
        <Icon name={red ? "mdi:cloud-off-outline" : "mdi:alert-circle-outline"} size={24} />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
          {red ? "Servidor no disponible" : "Algo salió mal"}
        </p>
        <p className="text-theme-xs text-gray-500 dark:text-gray-400" role="alert">
          {mensajeErrorConsulta(error)}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-theme-sm font-medium text-white transition hover:bg-brand-600"
      >
        <Icon name="mdi:refresh" size={16} />
        Reintentar
      </button>
    </div>
  );
}

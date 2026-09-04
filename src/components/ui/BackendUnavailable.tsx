"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/src/components/ui/Icon";

/** Pantalla amable cuando el API no responde (backend caído / sin red). */
export default function BackendUnavailable({
  message = "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.",
}: {
  message?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 dark:bg-gray-900">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
        <Icon name="mdi:cloud-off-outline" size={28} />
      </div>
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Servidor no disponible
        </h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">{message}</p>
        <p className="text-theme-xs text-gray-400 dark:text-gray-500">
          Si estás en desarrollo, comprueba que el backend (`npm run start:dev`) esté en marcha.
        </p>
      </div>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white transition hover:bg-brand-600"
      >
        <Icon name="mdi:refresh" size={18} />
        Reintentar
      </button>
    </div>
  );
}

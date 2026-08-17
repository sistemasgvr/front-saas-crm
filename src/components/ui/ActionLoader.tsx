"use client";

import { useIsMutating } from "@tanstack/react-query";
import { Spinner } from "@/src/components/ui/Spinner";

export function ActionLoader() {
  const mutating = useIsMutating();

  if (mutating === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-white/70 backdrop-blur-[2px] dark:bg-gray-900/70"
      role="status"
      aria-live="polite"
      aria-label="Procesando"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
        <Spinner size={36} className="text-brand-500" />
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">Procesando…</p>
      </div>
    </div>
  );
}

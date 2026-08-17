export function ModuleForbidden({ message }: { message?: string }) {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
      role="alert"
    >
      <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Módulo no disponible</p>
      <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
        {message ?? "Este módulo no está habilitado para tu organización."}
      </p>
    </div>
  );
}

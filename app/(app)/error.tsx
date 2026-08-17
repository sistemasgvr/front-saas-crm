"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4">
      <p className="text-theme-sm text-error-500" role="alert">
        {error.message || "Algo salió mal al cargar la página."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="text-theme-sm text-brand-500 hover:underline"
      >
        Reintentar
      </button>
    </div>
  );
}

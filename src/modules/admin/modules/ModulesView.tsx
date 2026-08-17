"use client";

import { useQuery } from "@tanstack/react-query";
import ActionButton from "@/src/components/ui/ActionButton";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { CreateModuleForm, EditModuleForm } from "./ModuleForms";
import { toggleModuleStatusAction } from "./actions";
import { getAdminModules } from "./queries";

export default function ModulesView() {
  const { data: modulos, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.adminModules,
    queryFn: () => getAdminModules(),
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <QueryError error={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Módulos</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Nuevo módulo</h2>
        <CreateModuleForm />
      </div>

      <div className="space-y-4">
        {(modulos ?? []).length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
            No hay módulos en el catálogo.
          </div>
        )}
        {(modulos ?? []).map((modulo) => (
          <div
            key={modulo.id}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span
                className={`rounded-full px-3 py-1 text-theme-xs font-medium ${
                  modulo.estado === 1
                    ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {modulo.estado === 1 ? "Catálogo activo" : "Retirado"}
              </span>
              <ActionButton
                action={() => toggleModuleStatusAction(modulo.id, modulo.estado === 1 ? 0 : 1)}
                successMessage={modulo.estado === 1 ? "Módulo desactivado" : "Módulo activado"}
                loadingText={modulo.estado === 1 ? "Desactivando…" : "Activando…"}
                invalidateKeys={[queryKeys.adminModules]}
              >
                {modulo.estado === 1 ? "Desactivar" : "Activar"}
              </ActionButton>
            </div>
            <EditModuleForm modulo={modulo} />
          </div>
        ))}
      </div>
    </div>
  );
}

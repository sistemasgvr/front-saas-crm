"use client";

import { useQuery } from "@tanstack/react-query";
import ActionButton from "@/src/components/ui/ActionButton";
import Avatar from "@/src/components/ui/avatar/Avatar";
import { StatusBadge } from "@/src/components/ui/badge/Badge";
import EmptyState from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
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
      <PageHeader title="Módulos" description="Catálogo de funcionalidades que se activan por empresa." />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Nuevo módulo</h2>
        <CreateModuleForm />
      </div>

      <div className="space-y-4">
        {(modulos ?? []).length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <EmptyState icon="mdi:puzzle-outline" title="No hay módulos en el catálogo." />
          </div>
        )}
        {(modulos ?? []).map((modulo) => (
          <div
            key={modulo.id}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  name={modulo.nombre}
                  icon={modulo.icono || "mdi:puzzle-outline"}
                  shape="rounded"
                  size="md"
                />
                <div>
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{modulo.nombre}</p>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">{modulo.codigo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  active={modulo.estado === 1}
                  activeLabel="Catálogo activo"
                  inactiveLabel="Retirado"
                />
                <ActionButton
                  action={() => toggleModuleStatusAction(modulo.id, modulo.estado === 1 ? 0 : 1)}
                  successMessage={modulo.estado === 1 ? "Módulo desactivado" : "Módulo activado"}
                  loadingText={modulo.estado === 1 ? "Desactivando…" : "Activando…"}
                  startIcon={
                    <Icon
                      name={modulo.estado === 1 ? "mdi:pause-circle-outline" : "mdi:play-circle-outline"}
                      size={18}
                    />
                  }
                  invalidateKeys={[queryKeys.adminModules]}
                >
                  {modulo.estado === 1 ? "Desactivar" : "Activar"}
                </ActionButton>
              </div>
            </div>
            <EditModuleForm modulo={modulo} />
          </div>
        ))}
      </div>
    </div>
  );
}

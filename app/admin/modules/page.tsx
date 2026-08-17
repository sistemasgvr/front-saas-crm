import { apiFetch } from "@/src/lib/api";
import Button from "@/src/components/ui/button/Button";
import { CreateModuleForm, EditModuleForm } from "@/src/modules/admin/modules/ModuleForms";
import { toggleModuleStatusAction } from "@/src/modules/admin/modules/actions";
import type { ModuloAdmin } from "@/src/modules/admin/types";

export default async function AdminModulesPage() {
  const modulos = await apiFetch<ModuloAdmin[]>("/admin/modules");

  return (
    <div className="space-y-6">
      <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Módulos</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Nuevo módulo</h2>
        <CreateModuleForm />
      </div>

      <div className="space-y-4">
        {modulos.map((modulo) => (
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
              <form action={toggleModuleStatusAction.bind(null, modulo.id, modulo.estado === 1 ? 0 : 1)}>
                <Button type="submit" size="sm" variant="outline">
                  {modulo.estado === 1 ? "Desactivar" : "Activar"}
                </Button>
              </form>
            </div>
            <EditModuleForm modulo={modulo} />
          </div>
        ))}
      </div>
    </div>
  );
}

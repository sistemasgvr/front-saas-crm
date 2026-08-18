"use client";

import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import Avatar from "@/src/components/ui/avatar/Avatar";
import { toggleOrganizationModuleAction } from "./actions";
import type { ModuloMatriz } from "../types";
import Switch from "@/src/components/form/switch/Switch";
import { Spinner } from "@/src/components/ui/Spinner";

export default function ModulesMatrix({
  organizacionId,
  modulos,
}: {
  organizacionId: string;
  modulos: ModuloMatriz[];
}) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const mutation = useAppMutation({
    mutationFn: (payload: { moduloId: string; habilitado: boolean; nombre: string }) =>
      toggleOrganizationModuleAction(organizacionId, payload.moduloId, payload.habilitado),
    invalidateKeys: [queryKeys.adminOrganizationModules(organizacionId)],
  });

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-800">
      {modulos.map((modulo) => {
        const isLoading = mutation.isPending && mutation.variables?.moduloId === modulo.id;
        const habilitado = optimistic[modulo.id] ?? modulo.habilitado;
        return (
          <li key={modulo.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Avatar name={modulo.nombre} icon={modulo.icono || "mdi:puzzle-outline"} shape="rounded" size="sm" />
              <div>
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{modulo.nombre}</p>
                <p className="text-theme-xs text-gray-500">{modulo.codigo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoading ? <Spinner size={14} /> : null}
              <Switch
                label={habilitado ? "Activo" : "Inactivo"}
                checked={habilitado}
                disabled={mutation.isPending}
                onChange={(next) => {
                  setOptimistic((prev) => ({ ...prev, [modulo.id]: next }));
                  mutation.mutate(
                    { moduloId: modulo.id, habilitado: next, nombre: modulo.nombre },
                    {
                      onSuccess: () => {
                        toast.success(next ? `${modulo.nombre} activado` : `${modulo.nombre} desactivado`);
                      },
                      onError: () => {
                        setOptimistic((prev) => ({ ...prev, [modulo.id]: !next }));
                      },
                    },
                  );
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

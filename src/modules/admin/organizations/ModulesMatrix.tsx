"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import Avatar from "@/src/components/ui/avatar/Avatar";
import { toggleOrganizationModuleAction } from "./actions";
import type { ModuloMatriz } from "../types";
import Switch from "@/src/components/form/switch/Switch";
import { Spinner } from "@/src/components/ui/Spinner";
import WhatsappBotPanel from "./WhatsappBotPanel";

export default function ModulesMatrix({
  organizacionId,
  modulos,
  activa = true,
}: {
  organizacionId: string;
  modulos: ModuloMatriz[];
  activa?: boolean;
}) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const mutation = useAppMutation({
    mutationFn: (payload: {
      moduloId: string;
      habilitado: boolean;
      nombre: string;
    }) =>
      toggleOrganizationModuleAction(
        organizacionId,
        payload.moduloId,
        payload.habilitado,
      ),
    invalidateKeys: [
      queryKeys.adminOrganizationModules(organizacionId),
      queryKeys.adminWhatsappBot(organizacionId),
      queryKeys.whatsappBotPreferencias,
    ],
  });

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-800">
      {modulos.map((modulo) => {
        const isLoading =
          mutation.isPending && mutation.variables?.moduloId === modulo.id;
        const habilitado = optimistic[modulo.id] ?? modulo.habilitado;
        return (
          <li
            key={modulo.id}
            className="flex flex-wrap items-center justify-between gap-y-3 py-3"
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={modulo.nombre}
                icon={modulo.icono || "mdi:puzzle-outline"}
                shape="rounded"
                size="sm"
              />
              <div>
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {modulo.nombre}
                </p>
                <p className="text-theme-xs text-gray-500">{modulo.codigo}</p>
                {modulo.descripcion ? (
                  <p className="mt-0.5 max-w-md text-theme-xs text-gray-400 dark:text-gray-500">
                    {modulo.descripcion}
                  </p>
                ) : null}
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
                    {
                      moduloId: modulo.id,
                      habilitado: next,
                      nombre: modulo.nombre,
                    },
                    {
                      onSuccess: async () => {
                        await queryClient.invalidateQueries({
                          queryKey:
                            queryKeys.adminOrganizationModules(organizacionId),
                        });
                        setOptimistic((prev) => {
                          const nextState = { ...prev };
                          delete nextState[modulo.id];
                          return nextState;
                        });
                        toast.success(
                          next
                            ? `${modulo.nombre} activado`
                            : `${modulo.nombre} desactivado`,
                        );
                      },
                      onError: () => {
                        setOptimistic((prev) => {
                          const nextState = { ...prev };
                          delete nextState[modulo.id];
                          return nextState;
                        });
                        void queryClient.invalidateQueries({
                          queryKey:
                            queryKeys.adminOrganizationModules(organizacionId),
                        });
                      },
                    },
                  );
                }}
              />
            </div>
            {modulo.codigo === "AUTOMATIZACIONES" && (
              <div className="w-full border-l-2 border-gray-100 pl-4 sm:ml-11 dark:border-gray-800">
                <WhatsappBotPanel
                  id={organizacionId}
                  activa={activa}
                  automatizacionesHabilitado={habilitado}
                  whatsappHabilitado={
                    !!modulos.some(
                      (m) =>
                        m.codigo === "WHATSAPP" &&
                        (optimistic[m.id] ?? m.habilitado),
                    )
                  }
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

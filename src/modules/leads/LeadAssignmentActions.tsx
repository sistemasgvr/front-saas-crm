"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dropdown } from "@/src/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/src/components/ui/dropdown/DropdownItem";
import TableAction from "@/src/components/ui/TableAction";
import { queryKeys } from "@/src/lib/query/keys";
import { unwrapAction } from "@/src/lib/action-result";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { asignarLeadAction, liberarLeadAction, tomarLeadAction } from "./actions";
import { getAsignables } from "./queries";
import type { ReferenciaNombrada } from "./types";
import { usePermisos } from "@/src/context/PermisosContext";

export default function LeadAssignmentActions({
  leadId,
  asignado,
}: {
  leadId: string;
  asignado: ReferenciaNombrada | null;
}) {
  const [asignarAbierto, setAsignarAbierto] = useState(false);
  const queryClient = useQueryClient();
  const puede = usePermisos();
  const esAdmin = puede("leads.asignar");

  const asignablesQuery = useQuery({
    queryKey: queryKeys.leadsAsignables,
    queryFn: getAsignables,
    enabled: asignarAbierto,
  });

  const tomar = useAppMutation({
    mutationFn: async () => unwrapAction(await tomarLeadAction(leadId)),
    successMessage: "Lead tomado",
    invalidateKeys: [queryKeys.leadsAll, queryKeys.whatsappChats],
  });
  const liberar = useAppMutation({
    mutationFn: async (asesorId: string) => unwrapAction(await liberarLeadAction(leadId, asesorId)),
    successMessage: "Lead liberado",
    invalidateKeys: [queryKeys.leadsAll, queryKeys.whatsappChats],
  });
  const asignar = useAppMutation({
    mutationFn: async ({ usuarioId, asesorEsperadoId }: {
      usuarioId: string;
      asesorEsperadoId: string | null;
    }) => unwrapAction(await asignarLeadAction(leadId, usuarioId, asesorEsperadoId)),
    successMessage: "Lead asignado",
    invalidateKeys: [queryKeys.leadsAll, queryKeys.whatsappChats],
  });
  const ocupado = tomar.isPending || liberar.isPending || asignar.isPending;
  const alFallar = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.leadsAll });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {!asignado && (
        <TableAction
          icon="mdi:hand-front-left-outline"
          label="Tomar lead"
          disabled={ocupado}
          onClick={() => tomar.mutate(undefined, { onError: alFallar })}
        />
      )}
      {esAdmin && (
        <div className="relative">
          <TableAction
            icon="mdi:account-arrow-right-outline"
            label="Asignar a…"
            disabled={ocupado}
            className="dropdown-toggle"
            onClick={() => setAsignarAbierto((v) => !v)}
          />
          <Dropdown isOpen={asignarAbierto} onClose={() => setAsignarAbierto(false)} className="w-56">
            {asignablesQuery.isLoading ? (
              <p className="px-4 py-3 text-theme-sm text-gray-500">Cargando…</p>
            ) : asignablesQuery.isError ? (
              <button type="button" className="px-4 py-3 text-left text-theme-sm" onClick={() => void asignablesQuery.refetch()}>
                No se pudo cargar a los asesores. Reintentar.
              </button>
            ) : !asignablesQuery.data || asignablesQuery.data.length === 0 ? (
              <p className="px-4 py-3 text-theme-sm text-gray-500">Sin miembros en la organización.</p>
            ) : (
              asignablesQuery.data.map((usuario) => (
                <DropdownItem
                  key={usuario.id}
                  onClick={() => {
                    setAsignarAbierto(false);
                    asignar.mutate({ usuarioId: usuario.id, asesorEsperadoId: asignado?.id ?? null }, { onError: alFallar });
                  }}
                  className={usuario.id === asignado?.id ? "font-medium text-brand-500" : ""}
                >
                  {usuario.nombre}
                </DropdownItem>
              ))
            )}
          </Dropdown>
        </div>
      )}
      {esAdmin && asignado && (
        <TableAction
          icon="mdi:link-off"
          label="Liberar lead"
          variant="danger"
          disabled={ocupado}
          onClick={() => liberar.mutate(asignado.id, { onError: alFallar })}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dropdown } from "@/src/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/src/components/ui/dropdown/DropdownItem";
import TableAction from "@/src/components/ui/TableAction";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { canManageOrganization } from "@/src/lib/roles";
import { asignarLeadAction, liberarLeadAction, tomarLeadAction } from "./actions";
import { getAsignables } from "./queries";
import type { ReferenciaNombrada } from "./types";

export default function LeadAssignmentActions({
  leadId,
  asignado,
  rol,
}: {
  leadId: string;
  asignado: ReferenciaNombrada | null;
  rol: "PROPIETARIO" | "ADMINISTRADOR" | "USUARIO" | null;
}) {
  const [asignarAbierto, setAsignarAbierto] = useState(false);
  const esAdmin = canManageOrganization(rol);

  const asignablesQuery = useQuery({
    queryKey: queryKeys.leadsAsignables,
    queryFn: getAsignables,
    enabled: asignarAbierto,
  });

  const tomar = useAppMutation({
    mutationFn: () => tomarLeadAction(leadId),
    successMessage: "Lead tomado",
    invalidateKeys: [queryKeys.leadsAll],
  });
  const liberar = useAppMutation({
    mutationFn: () => liberarLeadAction(leadId),
    successMessage: "Lead liberado",
    invalidateKeys: [queryKeys.leadsAll],
  });
  const asignar = useAppMutation({
    mutationFn: (usuarioId: string) => asignarLeadAction(leadId, usuarioId),
    successMessage: "Lead asignado",
    invalidateKeys: [queryKeys.leadsAll],
  });

  return (
    <div className="flex items-center justify-end gap-1">
      {!asignado && (
        <TableAction
          icon="mdi:hand-front-left-outline"
          label="Tomar lead"
          onClick={() => tomar.mutate()}
        />
      )}
      {esAdmin && (
        <div className="relative">
          <TableAction
            icon="mdi:account-arrow-right-outline"
            label="Asignar a…"
            className="dropdown-toggle"
            onClick={() => setAsignarAbierto((v) => !v)}
          />
          <Dropdown isOpen={asignarAbierto} onClose={() => setAsignarAbierto(false)} className="w-56">
            {asignablesQuery.isLoading ? (
              <p className="px-4 py-3 text-theme-sm text-gray-500">Cargando…</p>
            ) : !asignablesQuery.data || asignablesQuery.data.length === 0 ? (
              <p className="px-4 py-3 text-theme-sm text-gray-500">Sin miembros en la organización.</p>
            ) : (
              asignablesQuery.data.map((usuario) => (
                <DropdownItem
                  key={usuario.id}
                  onClick={() => {
                    setAsignarAbierto(false);
                    asignar.mutate(usuario.id);
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
          onClick={() => liberar.mutate()}
        />
      )}
    </div>
  );
}

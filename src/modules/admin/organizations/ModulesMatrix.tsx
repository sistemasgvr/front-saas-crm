"use client";

import { useTransition } from "react";
import { toggleOrganizationModuleAction } from "./actions";
import type { ModuloMatriz } from "../types";
import { Icon } from "@/src/components/ui/Icon";

export default function ModulesMatrix({
  organizacionId,
  modulos,
}: {
  organizacionId: string;
  modulos: ModuloMatriz[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-800">
      {modulos.map((modulo) => (
        <li key={modulo.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            {modulo.icono && <Icon name={modulo.icono} size={20} />}
            <div>
              <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{modulo.nombre}</p>
              <p className="text-theme-xs text-gray-500">{modulo.codigo}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(() => toggleOrganizationModuleAction(organizacionId, modulo.id, !modulo.habilitado))
            }
            className={`rounded-full px-3 py-1 text-theme-xs font-medium ${
              modulo.habilitado
                ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
            }`}
          >
            {modulo.habilitado ? "Activo" : "Inactivo"}
          </button>
        </li>
      ))}
    </ul>
  );
}

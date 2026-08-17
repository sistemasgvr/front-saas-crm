"use client";

import { useActionState } from "react";
import Label from "@/src/components/form/Label";
import Button from "@/src/components/ui/button/Button";
import { assignUserOrgAction, type FormState } from "./actions";
import type { OrganizacionAdmin } from "../types";

const empty: FormState = {};

export default function AssignOrgForm({
  userId,
  organizaciones,
}: {
  userId: string;
  organizaciones: OrganizacionAdmin[];
}) {
  const action = assignUserOrgAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(action, empty);
  const activas = organizaciones.filter((org) => org.estado === 1);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="organizacionId">Empresa</Label>
          <select
            id="organizacionId"
            name="organizacionId"
            required
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            {activas.map((org) => (
              <option key={org.id} value={org.id}>
                {org.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="rol">Rol</Label>
          <select
            id="rol"
            name="rol"
            required
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            defaultValue="USUARIO"
          >
            <option value="PROPIETARIO">PROPIETARIO</option>
            <option value="ADMINISTRADOR">ADMINISTRADOR</option>
            <option value="USUARIO">USUARIO</option>
          </select>
        </div>
      </div>
      {state.error && <p className="text-sm text-error-500">{state.error}</p>}
      {state.success && <p className="text-sm text-success-500">{state.success}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Asignando…" : "Asignar"}
      </Button>
    </form>
  );
}

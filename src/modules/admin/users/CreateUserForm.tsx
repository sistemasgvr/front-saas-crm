"use client";

import { useActionState } from "react";
import Link from "next/link";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { createUserAction, type FormState } from "./actions";
import type { OrganizacionAdmin } from "../types";

const empty: FormState = {};

export default function CreateUserForm({ organizaciones }: { organizaciones: OrganizacionAdmin[] }) {
  const [state, formAction, pending] = useActionState(createUserAction, empty);
  const activas = organizaciones.filter((org) => org.estado === 1);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" name="nombre" required />
          </div>
          <div>
            <Label htmlFor="apellido">Apellido</Label>
            <Input id="apellido" name="apellido" />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Contraseña *</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" name="telefono" />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" name="esAdminPlataforma" className="rounded border-gray-300" />
              Admin de plataforma
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Asignar a empresa (opcional)</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="organizacionId">Empresa</Label>
            <select
              id="organizacionId"
              name="organizacionId"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">Sin asignar</option>
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
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              defaultValue="PROPIETARIO"
            >
              <option value="PROPIETARIO">PROPIETARIO</option>
              <option value="ADMINISTRADOR">ADMINISTRADOR</option>
              <option value="USUARIO">USUARIO</option>
            </select>
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm text-error-500">{state.error}</p>}
      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creando…" : "Crear usuario"}
        </Button>
        <Link href="/admin/users" className="inline-flex items-center text-theme-sm text-gray-500">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { createOrganizationAction, type FormState } from "./actions";

const empty: FormState = {};

export default function CreateOrganizationForm() {
  const [state, formAction, pending] = useActionState(createOrganizationAction, empty);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Empresa</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" name="nombre" required />
          </div>
          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" name="slug" placeholder="mi-empresa" required />
          </div>
          <div>
            <Label htmlFor="razonSocial">Razón social</Label>
            <Input id="razonSocial" name="razonSocial" />
          </div>
          <div>
            <Label htmlFor="documentoFiscal">RUC / documento</Label>
            <Input id="documentoFiscal" name="documentoFiscal" />
          </div>
          <div>
            <Label htmlFor="emailContacto">Email contacto</Label>
            <Input id="emailContacto" name="emailContacto" type="email" />
          </div>
          <div>
            <Label htmlFor="telefonoContacto">Teléfono</Label>
            <Input id="telefonoContacto" name="telefonoContacto" />
          </div>
          <div>
            <Label htmlFor="pais">País</Label>
            <Input id="pais" name="pais" defaultValue="PE" />
          </div>
          <div>
            <Label htmlFor="zonaHoraria">Zona horaria</Label>
            <Input id="zonaHoraria" name="zonaHoraria" defaultValue="America/Lima" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Primer usuario (opcional)</h2>
        <p className="mb-5 text-theme-sm text-gray-500">Se crea como PROPIETARIO de esta empresa.</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="primerNombre">Nombre</Label>
            <Input id="primerNombre" name="primerNombre" />
          </div>
          <div>
            <Label htmlFor="primerApellido">Apellido</Label>
            <Input id="primerApellido" name="primerApellido" />
          </div>
          <div>
            <Label htmlFor="primerEmail">Email</Label>
            <Input id="primerEmail" name="primerEmail" type="email" />
          </div>
          <div>
            <Label htmlFor="primerPassword">Contraseña</Label>
            <Input id="primerPassword" name="primerPassword" type="password" />
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm text-error-500">{state.error}</p>}
      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creando…" : "Crear empresa"}
        </Button>
        <Link href="/admin/organizations" className="inline-flex items-center text-theme-sm text-gray-500">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

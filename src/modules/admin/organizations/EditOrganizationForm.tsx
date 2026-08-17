"use client";

import { useActionState } from "react";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { updateOrganizationAdminAction, type FormState } from "./actions";
import type { OrganizacionAdmin } from "../types";

const empty: FormState = {};

export default function EditOrganizationForm({ org }: { org: OrganizacionAdmin }) {
  const action = updateOrganizationAdminAction.bind(null, org.id);
  const [state, formAction, pending] = useActionState(action, empty);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" defaultValue={org.nombre} required />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={org.slug} required />
        </div>
        <div>
          <Label htmlFor="razonSocial">Razón social</Label>
          <Input id="razonSocial" name="razonSocial" defaultValue={org.razonSocial ?? ""} />
        </div>
        <div>
          <Label htmlFor="documentoFiscal">Documento fiscal</Label>
          <Input id="documentoFiscal" name="documentoFiscal" defaultValue={org.documentoFiscal ?? ""} />
        </div>
        <div>
          <Label htmlFor="emailContacto">Email</Label>
          <Input id="emailContacto" name="emailContacto" type="email" defaultValue={org.emailContacto ?? ""} />
        </div>
        <div>
          <Label htmlFor="telefonoContacto">Teléfono</Label>
          <Input id="telefonoContacto" name="telefonoContacto" defaultValue={org.telefonoContacto ?? ""} />
        </div>
        <div>
          <Label htmlFor="pais">País</Label>
          <Input id="pais" name="pais" defaultValue={org.pais ?? ""} />
        </div>
        <div>
          <Label htmlFor="zonaHoraria">Zona horaria</Label>
          <Input id="zonaHoraria" name="zonaHoraria" defaultValue={org.zonaHoraria} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notas">Notas internas</Label>
          <Input id="notas" name="notas" defaultValue={org.notas ?? ""} />
        </div>
      </div>
      {state.error && <p className="text-sm text-error-500">{state.error}</p>}
      {state.success && <p className="text-sm text-success-500">{state.success}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}

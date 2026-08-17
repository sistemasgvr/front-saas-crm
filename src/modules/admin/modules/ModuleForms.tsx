"use client";

import { useActionState } from "react";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { createModuleAction, updateModuleAction, type FormState } from "./actions";
import type { ModuloAdmin } from "../types";

const empty: FormState = {};

export function CreateModuleForm() {
  const [state, formAction, pending] = useActionState(createModuleAction, empty);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="codigo">Código *</Label>
        <Input id="codigo" name="codigo" placeholder="CRM" required />
      </div>
      <div>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" name="nombre" required />
      </div>
      <div>
        <Label htmlFor="icono">Icono Iconify</Label>
        <Input id="icono" name="icono" placeholder="mdi:view-dashboard" />
      </div>
      <div>
        <Label htmlFor="orden">Orden</Label>
        <Input id="orden" name="orden" type="number" defaultValue="0" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input id="descripcion" name="descripcion" />
      </div>
      {state.error && <p className="text-sm text-error-500 sm:col-span-2">{state.error}</p>}
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creando…" : "Crear módulo"}
        </Button>
      </div>
    </form>
  );
}

export function EditModuleForm({ modulo }: { modulo: ModuloAdmin }) {
  const action = updateModuleAction.bind(null, modulo.id);
  const [state, formAction, pending] = useActionState(action, empty);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
      <div className="sm:col-span-1">
        <Label>Código</Label>
        <Input defaultValue={modulo.codigo} disabled />
      </div>
      <div>
        <Label htmlFor={`nombre-${modulo.id}`}>Nombre</Label>
        <Input id={`nombre-${modulo.id}`} name="nombre" defaultValue={modulo.nombre} required />
      </div>
      <div>
        <Label htmlFor={`icono-${modulo.id}`}>Icono</Label>
        <Input id={`icono-${modulo.id}`} name="icono" defaultValue={modulo.icono ?? ""} />
      </div>
      <div>
        <Label htmlFor={`orden-${modulo.id}`}>Orden</Label>
        <Input id={`orden-${modulo.id}`} name="orden" type="number" defaultValue={String(modulo.orden)} />
      </div>
      <div className="sm:col-span-3">
        <Label htmlFor={`descripcion-${modulo.id}`}>Descripción</Label>
        <Input id={`descripcion-${modulo.id}`} name="descripcion" defaultValue={modulo.descripcion ?? ""} />
      </div>
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Guardar"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-error-500 sm:col-span-4">{state.error}</p>}
      {state.success && <p className="text-sm text-success-500 sm:col-span-4">{state.success}</p>}
    </form>
  );
}

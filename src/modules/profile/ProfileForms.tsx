"use client";

import { useActionState } from "react";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { changePasswordAction, updateProfileAction, type FormState } from "./actions";

interface ProfileFormsProps {
  email: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
}

const empty: FormState = {};

export default function ProfileForms({ email, nombre, apellido, telefono }: ProfileFormsProps) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, empty);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, empty);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Datos personales</h2>
        <form action={profileAction} className="space-y-5">
          <div>
            <Label>Email</Label>
            <Input defaultValue={email} disabled />
          </div>
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" defaultValue={nombre} required />
          </div>
          <div>
            <Label htmlFor="apellido">Apellido</Label>
            <Input id="apellido" name="apellido" defaultValue={apellido ?? ""} />
          </div>
          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" name="telefono" defaultValue={telefono ?? ""} />
          </div>
          {profileState.error && <p className="text-sm text-error-500">{profileState.error}</p>}
          {profileState.success && <p className="text-sm text-success-500">{profileState.success}</p>}
          <Button type="submit" size="sm" disabled={profilePending}>
            {profilePending ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Cambiar contraseña</h2>
        <form action={passwordAction} className="space-y-5">
          <div>
            <Label htmlFor="passwordActual">Contraseña actual</Label>
            <Input id="passwordActual" name="passwordActual" type="password" required autoComplete="current-password" />
          </div>
          <div>
            <Label htmlFor="passwordNueva">Contraseña nueva</Label>
            <Input id="passwordNueva" name="passwordNueva" type="password" required autoComplete="new-password" />
          </div>
          {passwordState.error && <p className="text-sm text-error-500">{passwordState.error}</p>}
          {passwordState.success && <p className="text-sm text-success-500">{passwordState.success}</p>}
          <Button type="submit" size="sm" disabled={passwordPending}>
            {passwordPending ? "Actualizando…" : "Actualizar contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}

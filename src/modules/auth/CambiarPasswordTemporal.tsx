"use client";
import { useState, useTransition, type FormEvent } from "react";
import { changePasswordAction } from "@/src/modules/profile/actions";
import { logoutAction } from "./actions";
import PasswordInput from "@/src/components/form/input/PasswordInput";
import Label from "@/src/components/form/Label";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";

export default function CambiarPasswordTemporal() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    if (f.get("passwordNueva") !== f.get("confirmacion")) {
      setError("Las contraseñas no coinciden");
      return;
    }
    startTransition(async () => {
      try {
        await changePasswordAction(f);
        // Recarga completa: la sesión nueva debe leerse desde cero.
        window.location.assign(new URL("/dashboard", window.location.origin));
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se pudo cambiar la contraseña",
        );
      }
    });
  };
  return (
    <div className="flex w-full flex-col justify-center p-3 lg:w-1/2 lg:p-12">
      <div className="mx-auto w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Cambia tu contraseña
        </h1>
        <p className="text-sm text-gray-500">
          Tu contraseña es temporal. Elige una nueva para acceder al CRM.
        </p>
        <form onSubmit={submit}>
          <fieldset disabled={pending} className="space-y-5">
            <div>
              <Label htmlFor="password-actual">Contraseña temporal</Label>
              <PasswordInput
                id="password-actual"
                name="passwordActual"
                required
                autoComplete="current-password"
                maxLength={72}
              />
            </div>
            <div>
              <Label htmlFor="password-nueva">Nueva contraseña</Label>
              <PasswordInput
                id="password-nueva"
                name="passwordNueva"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="password-confirmacion">
                Confirmar nueva contraseña
              </Label>
              <PasswordInput
                id="password-confirmacion"
                name="confirmacion"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-error-600">
                {error}
              </p>
            )}
            <Button
              type="submit"
              loading={pending}
              startIcon={<Icon name="mdi:lock-check-outline" size={18} />}
            >
              Guardar y continuar
            </Button>
          </fieldset>
        </form>
        <Button
          variant="outline"
          disabled={pending}
          startIcon={<Icon name="mdi:logout" size={18} />}
          onClick={() =>
            startTransition(async () => {
              await logoutAction();
              window.location.assign(new URL("/login", window.location.origin));
            })
          }
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

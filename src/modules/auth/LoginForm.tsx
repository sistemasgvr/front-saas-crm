"use client";

import { useActionState, useState } from "react";
import Checkbox from "@/src/components/form/input/Checkbox";
import Input from "@/src/components/form/input/InputField";
import Label from "@/src/components/form/Label";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="flex flex-col flex-1 w-full lg:w-1/2">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Iniciar sesión
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingresa tu email y contraseña para continuar.
            </p>
          </div>

          <form action={formAction}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="email">
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="sistemas@proyectosgvr.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">
                  Contraseña <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    required
                    autoComplete="current-password"
                  />
                  <span
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 text-gray-500 dark:text-gray-400"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setShowPassword((prev) => !prev);
                      }
                    }}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <Icon name={showPassword ? "mdi:eye" : "mdi:eye-off"} size={20} />
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={rememberMe} onChange={setRememberMe} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Mantener sesión
                  </span>
                </div>
              </div>

              {state.error && (
                <p className="text-sm text-error-500" role="alert">
                  {state.error}
                </p>
              )}

              <div>
                <Button type="submit" className="w-full" size="sm" disabled={isPending}>
                  {isPending ? "Ingresando…" : "Ingresar"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

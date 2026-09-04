"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Checkbox from "@/src/components/form/input/Checkbox";
import Input from "@/src/components/form/input/InputField";
import PasswordInput from "@/src/components/form/input/PasswordInput";
import Label from "@/src/components/form/Label";
import Button from "@/src/components/ui/button/Button";
import AppLogo from "@/src/components/ui/AppLogo";
import { toFormData } from "@/src/lib/form-data";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { useAuthUiStore } from "@/src/stores/auth-ui.store";
import { loginAction } from "./actions";
import { loginSchema, type LoginValues } from "./schema";

export default function LoginForm() {
  const remember = useAuthUiStore((state) => state.remember);
  const forget = useAuthUiStore((state) => state.forget);
  const rememberedEmail = useAuthUiStore((state) => state.rememberedEmail);
  const remembered = useAuthUiStore((state) => state.rememberMe);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    if (!remembered || !rememberedEmail) return;
    setValue("email", rememberedEmail);
    setValue("rememberMe", true);
  }, [remembered, rememberedEmail, setValue]);

  const login = useAppMutation({
    mutationFn: async (values: LoginValues) => {
      const result = await loginAction(
        toFormData({ email: values.email, password: values.password, rememberMe: values.rememberMe }),
      );
      if (values.rememberMe) remember(values.email);
      else forget();

      // Navegación dura: sale del login al instante (cookies ya seteadas).
      // El soft router.push dejaba el formulario visible mientras cargaba el RSC.
      window.location.assign(result.redirectTo);

      // Mantener isPending / overlay hasta que el navegador descargue la página.
      await new Promise<never>(() => {});
    },
  });

  return (
    <div className="flex flex-col flex-1 w-full lg:w-1/2">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-6 flex justify-center lg:hidden">
            <AppLogo variant="full" width={200} height={50} priority />
          </div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Iniciar sesión
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingresa tu email y contraseña para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit((values) => login.mutate(values))} noValidate>
            <fieldset disabled={login.isPending} className="space-y-6">
              <div>
                <Label htmlFor="email">
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="sistemas@proyectosgvr.com"
                  autoComplete="username"
                  error={Boolean(errors.email)}
                  hint={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <div>
                <Label htmlFor="password">
                  Contraseña <span className="text-error-500">*</span>
                </Label>
                <PasswordInput
                  id="password"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  error={Boolean(errors.password)}
                  hint={errors.password?.message}
                  {...register("password")}
                />
              </div>

              <div className="flex items-center justify-between">
                <Controller
                  name="rememberMe"
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value} onChange={field.onChange} label="Recordar email" />
                  )}
                />
              </div>

              <div>
                <Button type="submit" className="w-full" size="sm" loading={login.isPending}>
                  {login.isPending ? "Ingresando…" : "Ingresar"}
                </Button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}

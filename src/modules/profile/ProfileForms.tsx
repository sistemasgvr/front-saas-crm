"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import PasswordInput from "@/src/components/form/input/PasswordInput";
import Button from "@/src/components/ui/button/Button";
import Avatar from "@/src/components/ui/avatar/Avatar";
import { Icon } from "@/src/components/ui/Icon";
import { toFormData } from "@/src/lib/form-data";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { changePasswordAction, updateProfileAction } from "./actions";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordValues,
  type UpdateProfileValues,
} from "./schema";

interface ProfileFormsProps {
  email: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
}

export default function ProfileForms({ email, nombre, apellido, telefono }: ProfileFormsProps) {
  const profileForm = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { nombre, apellido: apellido ?? "", telefono: telefono ?? "" },
  });
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { passwordActual: "", passwordNueva: "" },
  });

  const profile = useAppMutation({
    mutationFn: (values: UpdateProfileValues) => updateProfileAction(toFormData(values)),
    successMessage: "Perfil actualizado",
    invalidateKeys: [queryKeys.me],
    refresh: true,
  });
  const password = useAppMutation({
    mutationFn: async (values: ChangePasswordValues) => {
      await changePasswordAction(toFormData(values));
      passwordForm.reset({ passwordActual: "", passwordNueva: "" });
    },
    successMessage: "Contraseña actualizada",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <Avatar name={`${nombre} ${apellido ?? ""}`.trim()} size="xl" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-gray-800 dark:text-white/90">
            {nombre} {apellido ?? ""}
          </p>
          <p className="truncate text-theme-sm text-gray-500">{email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Datos personales</h2>
        <form onSubmit={profileForm.handleSubmit((values) => profile.mutate(values))} className="space-y-5" noValidate>
          <fieldset disabled={profile.isPending} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input defaultValue={email} disabled />
            </div>
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                error={Boolean(profileForm.formState.errors.nombre)}
                hint={profileForm.formState.errors.nombre?.message}
                {...profileForm.register("nombre")}
              />
            </div>
            <div>
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                error={Boolean(profileForm.formState.errors.apellido)}
                hint={profileForm.formState.errors.apellido?.message}
                {...profileForm.register("apellido")}
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                error={Boolean(profileForm.formState.errors.telefono)}
                hint={profileForm.formState.errors.telefono?.message}
                {...profileForm.register("telefono")}
              />
            </div>
            <Button type="submit" size="sm" loading={profile.isPending} startIcon={<Icon name="mdi:content-save-outline" size={18} />}>
              {profile.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </fieldset>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Cambiar contraseña</h2>
        <form onSubmit={passwordForm.handleSubmit((values) => password.mutate(values))} className="space-y-5" noValidate>
          <fieldset disabled={password.isPending} className="space-y-5">
            <div>
              <Label htmlFor="passwordActual">Contraseña actual</Label>
              <PasswordInput
                id="passwordActual"
                autoComplete="current-password"
                error={Boolean(passwordForm.formState.errors.passwordActual)}
                hint={passwordForm.formState.errors.passwordActual?.message}
                {...passwordForm.register("passwordActual")}
              />
            </div>
            <div>
              <Label htmlFor="passwordNueva">Contraseña nueva</Label>
              <PasswordInput
                id="passwordNueva"
                autoComplete="new-password"
                error={Boolean(passwordForm.formState.errors.passwordNueva)}
                hint={passwordForm.formState.errors.passwordNueva?.message}
                {...passwordForm.register("passwordNueva")}
              />
            </div>
            <Button type="submit" size="sm" loading={password.isPending} startIcon={<Icon name="mdi:lock-reset" size={18} />}>
              {password.isPending ? "Actualizando…" : "Actualizar contraseña"}
            </Button>
          </fieldset>
        </form>
      </div>
      </div>
    </div>
  );
}

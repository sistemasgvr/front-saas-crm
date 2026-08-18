"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import PasswordInput from "@/src/components/form/input/PasswordInput";
import Checkbox from "@/src/components/form/input/Checkbox";
import Select from "@/src/components/form/Select";
import Button from "@/src/components/ui/button/Button";
import { toFormData } from "@/src/lib/form-data";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { organizationSelectOptions } from "../organization-options";
import { ROL_OPTIONS } from "../constants";
import { createUserAction } from "./actions";
import { createUserSchema, type CreateUserValues } from "./schema";
import type { OrganizacionAdmin } from "../types";

export default function CreateUserForm({ organizaciones }: { organizaciones: OrganizacionAdmin[] }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      telefono: "",
      esAdminPlataforma: false,
      organizacionId: "",
      rol: "PROPIETARIO",
    },
  });

  const mutation = useAppMutation({
    mutationFn: (values: CreateUserValues) => createUserAction(toFormData(values)),
    successMessage: "Usuario creado",
    invalidateKeys: [queryKeys.adminUsersAll],
    redirectTo: "/admin/users",
  });
  const orgOptions = organizationSelectOptions(organizaciones);

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6" noValidate>
      <fieldset disabled={mutation.isPending} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" error={Boolean(errors.nombre)} hint={errors.nombre?.message} {...register("nombre")} />
            </div>
            <div>
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                error={Boolean(errors.apellido)}
                hint={errors.apellido?.message}
                {...register("apellido")}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                error={Boolean(errors.email)}
                hint={errors.email?.message}
                {...register("email")}
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                error={Boolean(errors.password)}
                hint={errors.password?.message}
                {...register("password")}
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                error={Boolean(errors.telefono)}
                hint={errors.telefono?.message}
                {...register("telefono")}
              />
            </div>
            <div className="flex items-end pb-2">
              <Controller
                name="esAdminPlataforma"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="esAdminPlataforma"
                    label="Admin de plataforma"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Asignar a empresa (opcional)</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="organizacionId">Empresa</Label>
              <Controller
                name="organizacionId"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    id="organizacionId"
                    placeholder="Sin asignar"
                    options={orgOptions}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    hint={fieldState.error?.message}
                  />
                )}
              />
            </div>
            <div>
              <Label htmlFor="rol">Rol</Label>
              <Controller
                name="rol"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    id="rol"
                    options={[...ROL_OPTIONS]}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    hint={fieldState.error?.message}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" size="sm" loading={mutation.isPending}>
            {mutation.isPending ? "Creando…" : "Crear usuario"}
          </Button>
          <Link href="/admin/users" className="inline-flex items-center text-theme-sm text-gray-500">
            Cancelar
          </Link>
        </div>
      </fieldset>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import PasswordInput from "@/src/components/form/input/PasswordInput";
import Button from "@/src/components/ui/button/Button";
import { toFormData } from "@/src/lib/form-data";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { createOrganizationAction } from "./actions";
import { createOrganizationSchema, type CreateOrganizationValues } from "./schema";

export default function CreateOrganizationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrganizationValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      nombre: "",
      slug: "",
      razonSocial: "",
      documentoFiscal: "",
      emailContacto: "",
      telefonoContacto: "",
      pais: "PE",
      zonaHoraria: "America/Lima",
      primerNombre: "",
      primerApellido: "",
      primerEmail: "",
      primerPassword: "",
    },
  });

  const mutation = useAppMutation({
    mutationFn: (values: CreateOrganizationValues) => createOrganizationAction(toFormData(values)),
    successMessage: "Empresa creada",
    invalidateKeys: [queryKeys.adminOrganizationsAll],
    redirectTo: "/admin/organizations",
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6" noValidate>
      <fieldset disabled={mutation.isPending} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">Empresa</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" error={Boolean(errors.nombre)} hint={errors.nombre?.message} {...register("nombre")} />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="mi-empresa"
                error={Boolean(errors.slug)}
                hint={errors.slug?.message}
                {...register("slug")}
              />
            </div>
            <div>
              <Label htmlFor="razonSocial">Razón social</Label>
              <Input
                id="razonSocial"
                error={Boolean(errors.razonSocial)}
                hint={errors.razonSocial?.message}
                {...register("razonSocial")}
              />
            </div>
            <div>
              <Label htmlFor="documentoFiscal">RUC / documento</Label>
              <Input
                id="documentoFiscal"
                error={Boolean(errors.documentoFiscal)}
                hint={errors.documentoFiscal?.message}
                {...register("documentoFiscal")}
              />
            </div>
            <div>
              <Label htmlFor="emailContacto">Email contacto</Label>
              <Input
                id="emailContacto"
                type="email"
                error={Boolean(errors.emailContacto)}
                hint={errors.emailContacto?.message}
                {...register("emailContacto")}
              />
            </div>
            <div>
              <Label htmlFor="telefonoContacto">Teléfono</Label>
              <Input
                id="telefonoContacto"
                error={Boolean(errors.telefonoContacto)}
                hint={errors.telefonoContacto?.message}
                {...register("telefonoContacto")}
              />
            </div>
            <div>
              <Label htmlFor="pais">País</Label>
              <Input id="pais" error={Boolean(errors.pais)} hint={errors.pais?.message} {...register("pais")} />
            </div>
            <div>
              <Label htmlFor="zonaHoraria">Zona horaria</Label>
              <Input
                id="zonaHoraria"
                error={Boolean(errors.zonaHoraria)}
                hint={errors.zonaHoraria?.message}
                {...register("zonaHoraria")}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Primer usuario (opcional)</h2>
          <p className="mb-5 text-theme-sm text-gray-500">Se crea como PROPIETARIO de esta empresa.</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="primerNombre">Nombre</Label>
              <Input
                id="primerNombre"
                error={Boolean(errors.primerNombre)}
                hint={errors.primerNombre?.message}
                {...register("primerNombre")}
              />
            </div>
            <div>
              <Label htmlFor="primerApellido">Apellido</Label>
              <Input
                id="primerApellido"
                error={Boolean(errors.primerApellido)}
                hint={errors.primerApellido?.message}
                {...register("primerApellido")}
              />
            </div>
            <div>
              <Label htmlFor="primerEmail">Email</Label>
              <Input
                id="primerEmail"
                type="email"
                error={Boolean(errors.primerEmail)}
                hint={errors.primerEmail?.message}
                {...register("primerEmail")}
              />
            </div>
            <div>
              <Label htmlFor="primerPassword">Contraseña</Label>
              <PasswordInput
                id="primerPassword"
                autoComplete="new-password"
                error={Boolean(errors.primerPassword)}
                hint={errors.primerPassword?.message}
                {...register("primerPassword")}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" size="sm" loading={mutation.isPending}>
            {mutation.isPending ? "Creando…" : "Crear empresa"}
          </Button>
          <Link href="/admin/organizations" className="inline-flex items-center text-theme-sm text-gray-500">
            Cancelar
          </Link>
        </div>
      </fieldset>
    </form>
  );
}

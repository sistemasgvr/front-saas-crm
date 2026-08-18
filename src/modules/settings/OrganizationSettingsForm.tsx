"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { toFormData } from "@/src/lib/form-data";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { updateOrganizationAction } from "./actions";
import { organizationSettingsSchema, type OrganizationSettingsValues } from "./schema";
import type { OrganizacionActual } from "./types";

export default function OrganizationSettingsForm({ org }: { org: OrganizacionActual }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationSettingsValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      nombre: org.nombre,
      razonSocial: org.razonSocial ?? "",
      documentoFiscal: org.documentoFiscal ?? "",
      emailContacto: org.emailContacto ?? "",
      telefonoContacto: org.telefonoContacto ?? "",
      logoUrl: org.logoUrl ?? "",
      pais: org.pais ?? "PE",
      zonaHoraria: org.zonaHoraria,
    },
  });

  const mutation = useAppMutation({
    mutationFn: (values: OrganizationSettingsValues) => updateOrganizationAction(toFormData(values)),
    successMessage: "Organización actualizada",
    invalidateKeys: [queryKeys.organizationCurrent],
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5" noValidate>
      <fieldset disabled={mutation.isPending} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="nombre">Nombre comercial</Label>
            <Input id="nombre" error={Boolean(errors.nombre)} hint={errors.nombre?.message} {...register("nombre")} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input defaultValue={org.slug} disabled />
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
            <Label htmlFor="documentoFiscal">Documento fiscal</Label>
            <Input
              id="documentoFiscal"
              error={Boolean(errors.documentoFiscal)}
              hint={errors.documentoFiscal?.message}
              {...register("documentoFiscal")}
            />
          </div>
          <div>
            <Label htmlFor="emailContacto">Email de contacto</Label>
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
            <Label htmlFor="pais">País (ISO)</Label>
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
          <div className="sm:col-span-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              error={Boolean(errors.logoUrl)}
              hint={errors.logoUrl?.message}
              {...register("logoUrl")}
            />
          </div>
        </div>
        <Button type="submit" size="sm" loading={mutation.isPending} startIcon={<Icon name="mdi:content-save-outline" size={18} />}>
          {mutation.isPending ? "Guardando…" : "Guardar organización"}
        </Button>
      </fieldset>
    </form>
  );
}

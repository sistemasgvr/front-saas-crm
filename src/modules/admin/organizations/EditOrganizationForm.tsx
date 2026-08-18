"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import TextArea from "@/src/components/form/input/TextArea";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { toFormData } from "@/src/lib/form-data";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { updateOrganizationAdminAction } from "./actions";
import { updateOrganizationAdminSchema, type UpdateOrganizationAdminValues } from "./schema";
import type { OrganizacionAdmin } from "../types";

export default function EditOrganizationForm({ org }: { org: OrganizacionAdmin }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateOrganizationAdminValues>({
    resolver: zodResolver(updateOrganizationAdminSchema),
    defaultValues: {
      nombre: org.nombre,
      slug: org.slug,
      razonSocial: org.razonSocial ?? "",
      documentoFiscal: org.documentoFiscal ?? "",
      emailContacto: org.emailContacto ?? "",
      telefonoContacto: org.telefonoContacto ?? "",
      pais: org.pais ?? "PE",
      zonaHoraria: org.zonaHoraria,
      notas: org.notas ?? "",
    },
  });

  const mutation = useAppMutation({
    mutationFn: (values: UpdateOrganizationAdminValues) =>
      updateOrganizationAdminAction(org.id, toFormData(values)),
    successMessage: "Empresa actualizada",
    invalidateKeys: [queryKeys.adminOrganizationsAll, queryKeys.adminOrganization(org.id)],
  });

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5" noValidate>
      <fieldset disabled={mutation.isPending} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" error={Boolean(errors.nombre)} hint={errors.nombre?.message} {...register("nombre")} />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" error={Boolean(errors.slug)} hint={errors.slug?.message} {...register("slug")} />
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
            <Label htmlFor="emailContacto">Email</Label>
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
          <div className="sm:col-span-2">
            <Label htmlFor="notas">Notas internas</Label>
            <TextArea
              id="notas"
              rows={3}
              placeholder="Notas internas"
              error={Boolean(errors.notas)}
              hint={errors.notas?.message}
              {...register("notas")}
            />
          </div>
        </div>
        <Button type="submit" size="sm" loading={mutation.isPending} startIcon={<Icon name="mdi:content-save-outline" size={18} />}>
          {mutation.isPending ? "Guardando…" : "Guardar"}
        </Button>
      </fieldset>
    </form>
  );
}

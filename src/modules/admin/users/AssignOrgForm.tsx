"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Label from "@/src/components/form/Label";
import Select from "@/src/components/form/Select";
import Button from "@/src/components/ui/button/Button";
import { toFormData } from "@/src/lib/form-data";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { organizationSelectOptions } from "../organization-options";
import { ROL_OPTIONS } from "../constants";
import { assignUserOrgAction } from "./actions";
import { assignOrgSchema, type AssignOrgValues } from "./schema";
import type { OrganizacionAdmin, UsuarioAdminDetalle } from "../types";

export default function AssignOrgForm({
  userId,
  organizaciones,
  membresias,
  cargandoEmpresas = false,
}: {
  userId: string;
  organizaciones: OrganizacionAdmin[];
  membresias: UsuarioAdminDetalle["organizaciones"];
  cargandoEmpresas?: boolean;
}) {
  const actual = membresias[0];
  const options = organizationSelectOptions(organizaciones, membresias);
  const { handleSubmit, control } = useForm<AssignOrgValues>({
    resolver: zodResolver(assignOrgSchema),
    defaultValues: {
      organizacionId: actual?.organizacionId ?? "",
      rol: actual?.rol ?? "USUARIO",
    },
  });

  const mutation = useAppMutation({
    mutationFn: (values: AssignOrgValues) => assignUserOrgAction(userId, toFormData(values)),
    successMessage: "Usuario asignado a la empresa",
    invalidateKeys: [queryKeys.adminUser(userId), queryKeys.adminUsers],
  });

  if (options.length === 0) {
    return (
      <p className="text-theme-sm text-gray-500">
        {cargandoEmpresas ? "Cargando empresas…" : "No hay empresas disponibles para asignar."}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
      <fieldset disabled={mutation.isPending} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="organizacionId">Empresa</Label>
            <Controller
              name="organizacionId"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  id="organizacionId"
                  placeholder="Selecciona una empresa"
                  options={options}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  required
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
                  required
                  error={Boolean(fieldState.error)}
                  hint={fieldState.error?.message}
                />
              )}
            />
          </div>
        </div>
        <Button type="submit" size="sm" loading={mutation.isPending}>
          {mutation.isPending ? "Asignando…" : "Asignar"}
        </Button>
      </fieldset>
    </form>
  );
}

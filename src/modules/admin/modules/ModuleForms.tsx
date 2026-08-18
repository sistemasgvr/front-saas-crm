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
import { createModuleAction, updateModuleAction } from "./actions";
import { createModuleSchema, updateModuleSchema, type CreateModuleValues, type UpdateModuleValues } from "./schema";
import type { ModuloAdmin } from "../types";

export function CreateModuleForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateModuleValues>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: { codigo: "", nombre: "", icono: "", orden: 0, descripcion: "" },
  });

  const mutation = useAppMutation({
    mutationFn: async (values: CreateModuleValues) => {
      await createModuleAction(toFormData(values));
      reset({ codigo: "", nombre: "", icono: "", orden: 0, descripcion: "" });
    },
    successMessage: "Módulo creado",
    invalidateKeys: [queryKeys.adminModules],
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      noValidate
    >
      <fieldset disabled={mutation.isPending} className="contents">
        <div>
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            placeholder="CRM"
            error={Boolean(errors.codigo)}
            hint={errors.codigo?.message}
            {...register("codigo")}
          />
        </div>
        <div>
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" error={Boolean(errors.nombre)} hint={errors.nombre?.message} {...register("nombre")} />
        </div>
        <div>
          <Label htmlFor="icono">Icono Iconify</Label>
          <Input
            id="icono"
            placeholder="mdi:view-dashboard"
            error={Boolean(errors.icono)}
            hint={errors.icono?.message}
            {...register("icono")}
          />
        </div>
        <div>
          <Label htmlFor="orden">Orden</Label>
          <Input
            id="orden"
            type="number"
            error={Boolean(errors.orden)}
            hint={errors.orden?.message}
            {...register("orden", { valueAsNumber: true })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <TextArea
            id="descripcion"
            rows={3}
            placeholder="Descripción del módulo"
            error={Boolean(errors.descripcion)}
            hint={errors.descripcion?.message}
            {...register("descripcion")}
          />
        </div>
        <div>
          <Button type="submit" size="sm" loading={mutation.isPending} startIcon={<Icon name="mdi:plus" size={18} />}>
            {mutation.isPending ? "Creando…" : "Crear módulo"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

export function EditModuleForm({ modulo }: { modulo: ModuloAdmin }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateModuleValues>({
    resolver: zodResolver(updateModuleSchema),
    defaultValues: {
      nombre: modulo.nombre,
      icono: modulo.icono ?? "",
      orden: modulo.orden,
      descripcion: modulo.descripcion ?? "",
    },
  });

  const mutation = useAppMutation({
    mutationFn: (values: UpdateModuleValues) => updateModuleAction(modulo.id, toFormData(values)),
    successMessage: "Módulo actualizado",
    invalidateKeys: [queryKeys.adminModules],
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end"
      noValidate
    >
      <fieldset disabled={mutation.isPending} className="contents">
        <div className="sm:col-span-1">
          <Label>Código</Label>
          <Input defaultValue={modulo.codigo} disabled />
        </div>
        <div>
          <Label htmlFor={`nombre-${modulo.id}`}>Nombre</Label>
          <Input
            id={`nombre-${modulo.id}`}
            error={Boolean(errors.nombre)}
            hint={errors.nombre?.message}
            {...register("nombre")}
          />
        </div>
        <div>
          <Label htmlFor={`icono-${modulo.id}`}>Icono</Label>
          <Input
            id={`icono-${modulo.id}`}
            error={Boolean(errors.icono)}
            hint={errors.icono?.message}
            {...register("icono")}
          />
        </div>
        <div>
          <Label htmlFor={`orden-${modulo.id}`}>Orden</Label>
          <Input
            id={`orden-${modulo.id}`}
            type="number"
            error={Boolean(errors.orden)}
            hint={errors.orden?.message}
            {...register("orden", { valueAsNumber: true })}
          />
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor={`descripcion-${modulo.id}`}>Descripción</Label>
          <TextArea
            id={`descripcion-${modulo.id}`}
            rows={2}
            error={Boolean(errors.descripcion)}
            hint={errors.descripcion?.message}
            {...register("descripcion")}
          />
        </div>
        <div>
          <Button type="submit" size="sm" loading={mutation.isPending} startIcon={<Icon name="mdi:content-save-outline" size={18} />}>
            {mutation.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

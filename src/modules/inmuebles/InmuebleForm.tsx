"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import TextArea from "@/src/components/form/input/TextArea";
import Select from "@/src/components/form/Select";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { toFormData } from "@/src/lib/form-data";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { createInmuebleAction, updateInmuebleAction } from "./actions";
import { inmuebleFormSchema, type InmuebleFormValues } from "./schema";
import {
  ESTADOS_INMUEBLE_OPTIONS,
  OPERACIONES_INMUEBLE_OPTIONS,
  TIPOS_INMUEBLE_OPTIONS,
  type InmuebleRow,
} from "./types";

const tipoOptions = TIPOS_INMUEBLE_OPTIONS.map((o) => ({ ...o }));
const operacionOptions = OPERACIONES_INMUEBLE_OPTIONS.map((o) => ({ ...o }));
const estadoOptions = ESTADOS_INMUEBLE_OPTIONS.map((o) => ({ ...o }));

function defaultsFrom(row?: InmuebleRow): InmuebleFormValues {
  return {
    codigo: row?.codigo ?? "",
    titulo: row?.titulo ?? "",
    tipo: (row?.tipo as InmuebleFormValues["tipo"]) ?? "DEPARTAMENTO",
    operacion: (row?.operacion as InmuebleFormValues["operacion"]) ?? "VENTA",
    zona: row?.zona ?? "",
    direccion: row?.direccion ?? "",
    precio: row?.precio != null ? String(row.precio) : "",
    moneda: row?.moneda ?? "PEN",
    estadoInmueble:
      (row?.estadoInmueble as InmuebleFormValues["estadoInmueble"]) ??
      "DISPONIBLE",
    notas: row?.notas ?? "",
  };
}

export default function InmuebleForm({
  mode,
  inmueble,
}: {
  mode: "create" | "edit";
  inmueble?: InmuebleRow;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InmuebleFormValues>({
    resolver: zodResolver(inmuebleFormSchema),
    defaultValues: defaultsFrom(inmueble),
  });

  const mutation = useAppMutation({
    mutationFn: (values: InmuebleFormValues) => {
      const fd = toFormData(values);
      return mode === "create"
        ? createInmuebleAction(fd)
        : updateInmuebleAction(inmueble!.id, fd);
    },
    successMessage: mode === "create" ? "Inmueble creado" : "Inmueble actualizado",
    invalidateKeys: [queryKeys.inmueblesAll, queryKeys.inmueblesFiltro],
    redirectTo:
      mode === "create"
        ? "/inmuebles"
        : inmueble
          ? `/inmuebles/${inmueble.id}`
          : "/inmuebles",
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-6"
      noValidate
    >
      <fieldset disabled={mutation.isPending} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                placeholder="Ej. DOM-101"
                error={Boolean(errors.codigo)}
                hint={errors.codigo?.message}
                {...register("codigo")}
              />
            </div>
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Ej. Departamento Torre A 101"
                error={Boolean(errors.titulo)}
                hint={errors.titulo?.message}
                {...register("titulo")}
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Select
                    options={tipoOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Tipo"
                  />
                )}
              />
            </div>
            <div>
              <Label>Operación *</Label>
              <Controller
                name="operacion"
                control={control}
                render={({ field }) => (
                  <Select
                    options={operacionOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Operación"
                  />
                )}
              />
            </div>
            <div>
              <Label htmlFor="zona">Zona</Label>
              <Input
                id="zona"
                placeholder="Ej. Miraflores"
                error={Boolean(errors.zona)}
                hint={errors.zona?.message}
                {...register("zona")}
              />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                placeholder="Calle, número, referencia"
                error={Boolean(errors.direccion)}
                hint={errors.direccion?.message}
                {...register("direccion")}
              />
            </div>
            <div>
              <Label htmlFor="precio">Precio</Label>
              <Input
                id="precio"
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                error={Boolean(errors.precio)}
                hint={errors.precio?.message}
                {...register("precio")}
              />
            </div>
            <div>
              <Label htmlFor="moneda">Moneda</Label>
              <Input
                id="moneda"
                placeholder="PEN"
                error={Boolean(errors.moneda)}
                hint={errors.moneda?.message}
                {...register("moneda")}
              />
            </div>
            <div>
              <Label>Estado del inmueble *</Label>
              <Controller
                name="estadoInmueble"
                control={control}
                render={({ field }) => (
                  <Select
                    options={estadoOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Estado"
                  />
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notas">Notas</Label>
              <TextArea
                id="notas"
                rows={3}
                placeholder="Detalles internos, amenities, observaciones…"
                {...register("notas")}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" loading={mutation.isPending}>
            <Icon name={mode === "create" ? "mdi:plus" : "mdi:content-save-outline"} size={18} />
            {mode === "create" ? "Crear inmueble" : "Guardar cambios"}
          </Button>
          <Link
            href={inmueble ? `/inmuebles/${inmueble.id}` : "/inmuebles"}
            className="text-theme-sm text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
          >
            Cancelar
          </Link>
        </div>
      </fieldset>
    </form>
  );
}

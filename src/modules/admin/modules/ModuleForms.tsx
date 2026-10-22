"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import TextArea from "@/src/components/form/input/TextArea";
import Select from "@/src/components/form/Select";
import MultiSelect from "@/src/components/form/MultiSelect";
import Avatar from "@/src/components/ui/avatar/Avatar";
import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";
import { Icon } from "@/src/components/ui/Icon";
import { toFormData } from "@/src/lib/form-data";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import {
  createModuleAction,
  saveModuleGroupAction,
  updateModuleAction,
} from "./actions";
import {
  createModuleSchema,
  moduleGroupSchema,
  type CreateModuleValues,
  type ModuleGroupValues,
} from "./schema";
import type { ModuloAdmin, ModuloGrupo } from "../types";

export const moduleGroupsKey = ["admin-module-groups"] as const;

function FormHeader({
  title,
  description,
  nombre,
  icono,
}: {
  title: string;
  description: string;
  nombre: string;
  icono?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-5 pr-14 sm:p-6 sm:pr-16">
      <Avatar
        name={nombre || title}
        icon={icono || "mdi:puzzle-outline"}
        shape="rounded"
        size="md"
      />
      <div className="min-w-0">
        <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
          {title}
        </p>
        <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function FormFooter({
  onCancel,
  onSubmit,
  loading,
  label,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end sm:p-5">
      <Button
        size="sm"
        variant="outline"
        className="w-full sm:w-auto"
        disabled={loading}
        onClick={onCancel}
      >
        Cancelar
      </Button>
      <Button
        size="sm"
        className="w-full sm:w-auto"
        loading={loading}
        onClick={onSubmit}
        startIcon={<Icon name="mdi:content-save-outline" size={18} />}
      >
        {label}
      </Button>
    </div>
  );
}

const MODULO_VACIO: CreateModuleValues = {
  grupoId: "",
  requiere: [],
  codigo: "",
  nombre: "",
  icono: "",
  orden: 0,
  descripcion: "",
};

/** Alta y edición de un submódulo del catálogo. Sin `modulo` = crear. */
export function ModuleFormModal({
  open,
  onClose,
  modulo,
  grupoIdInicial,
  grupos,
  catalogo,
}: {
  open: boolean;
  onClose: () => void;
  modulo?: ModuloAdmin | null;
  grupoIdInicial?: string;
  grupos: ModuloGrupo[];
  catalogo: ModuloAdmin[];
}) {
  const editando = Boolean(modulo);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateModuleValues>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: MODULO_VACIO,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      modulo
        ? {
            grupoId: modulo.grupoId ?? "",
            requiere: modulo.requiere,
            codigo: modulo.codigo,
            nombre: modulo.nombre,
            icono: modulo.icono ?? "",
            orden: modulo.orden,
            descripcion: modulo.descripcion ?? "",
          }
        : { ...MODULO_VACIO, grupoId: grupoIdInicial ?? "" },
    );
  }, [open, modulo, grupoIdInicial, reset]);

  const [nombre, icono] = useWatch({ control, name: ["nombre", "icono"] });

  const mutation = useAppMutation({
    mutationFn: async (values: CreateModuleValues) => {
      if (modulo) {
        const { codigo, ...rest } = values;
        await updateModuleAction(modulo.id, toFormData(rest));
      } else {
        await createModuleAction(toFormData(values));
      }
      onClose();
    },
    successMessage: editando ? "Módulo actualizado" : "Módulo creado",
    invalidateKeys: [queryKeys.adminModules, moduleGroupsKey],
  });

  const grupoOptions = grupos
    .filter((g) => g.estado === 1 || g.id === modulo?.grupoId)
    .map((g) => ({ value: g.id, label: g.nombre }));
  const requiereOptions = catalogo
    .filter((m) => m.id !== modulo?.id)
    .map((m) => ({
      value: m.codigo,
      label: m.nombre,
      description: m.grupo ? `${m.grupo.nombre} · ${m.codigo}` : m.codigo,
      icon: m.icono || "mdi:puzzle-outline",
    }));

  const cerrar = () => {
    if (!mutation.isPending) onClose();
  };
  const enviar = handleSubmit((values) => mutation.mutate(values));

  return (
    <Modal
      open={open}
      onClose={cerrar}
      className="max-w-lg sm:max-w-2xl"
      header={
        <FormHeader
          title={editando ? "Editar módulo" : "Nuevo módulo"}
          description={
            editando
              ? `Código ${modulo?.codigo} · el código no se puede cambiar.`
              : "Funcionalidad que se activa por empresa dentro de un grupo."
          }
          nombre={nombre}
          icono={icono}
        />
      }
      footer={
        <FormFooter
          onCancel={cerrar}
          onSubmit={enviar}
          loading={mutation.isPending}
          label={editando ? "Guardar cambios" : "Crear módulo"}
        />
      }
    >
      <form
        onSubmit={enviar}
        noValidate
        className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6"
      >
        <fieldset disabled={mutation.isPending} className="contents">
          <div>
            <Label htmlFor="modulo-grupo">Grupo *</Label>
            <Controller
              name="grupoId"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  id="modulo-grupo"
                  placeholder="Selecciona un grupo"
                  options={grupoOptions}
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
            <Label htmlFor="modulo-codigo">Código *</Label>
            <Input
              id="modulo-codigo"
              placeholder="LEADS"
              disabled={editando}
              error={Boolean(errors.codigo)}
              hint={errors.codigo?.message}
              {...register("codigo")}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="modulo-nombre">Nombre *</Label>
            <Input
              id="modulo-nombre"
              placeholder="Leads"
              error={Boolean(errors.nombre)}
              hint={errors.nombre?.message}
              {...register("nombre")}
            />
          </div>
          <div>
            <Label htmlFor="modulo-icono">Icono Iconify</Label>
            <Input
              id="modulo-icono"
              placeholder="mdi:account-multiple-outline"
              error={Boolean(errors.icono)}
              hint={errors.icono?.message ?? "Se muestra en la cabecera."}
              {...register("icono")}
            />
          </div>
          <div>
            <Label htmlFor="modulo-orden">Orden</Label>
            <Input
              id="modulo-orden"
              type="number"
              min={0}
              max={999}
              error={Boolean(errors.orden)}
              hint={errors.orden?.message ?? "Posición dentro del grupo."}
              {...register("orden", { valueAsNumber: true })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="modulo-requiere">Requiere</Label>
            <Controller
              name="requiere"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  id="modulo-requiere"
                  options={requiereOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Sin dependencias"
                  searchPlaceholder="Buscar módulo..."
                  hint="Al activar este módulo en una empresa, también se activarán los que requiere."
                />
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="modulo-descripcion">Descripción</Label>
            <TextArea
              id="modulo-descripcion"
              rows={3}
              placeholder="Qué habilita este módulo"
              error={Boolean(errors.descripcion)}
              hint={errors.descripcion?.message}
              {...register("descripcion")}
            />
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

const GRUPO_VACIO: ModuleGroupValues = {
  codigo: "",
  nombre: "",
  icono: "",
  orden: 0,
  descripcion: "",
};

/** Alta y edición de un grupo del catálogo. Sin `grupo` = crear. */
export function GroupFormModal({
  open,
  onClose,
  grupo,
}: {
  open: boolean;
  onClose: () => void;
  grupo?: ModuloGrupo | null;
}) {
  const editando = Boolean(grupo);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModuleGroupValues>({
    resolver: zodResolver(moduleGroupSchema),
    defaultValues: GRUPO_VACIO,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      grupo
        ? {
            codigo: grupo.codigo,
            nombre: grupo.nombre,
            icono: grupo.icono ?? "",
            orden: grupo.orden,
            descripcion: grupo.descripcion ?? "",
          }
        : GRUPO_VACIO,
    );
  }, [open, grupo, reset]);

  const [nombre, icono] = useWatch({ control, name: ["nombre", "icono"] });

  const mutation = useAppMutation({
    mutationFn: async (values: ModuleGroupValues) => {
      await saveModuleGroupAction(grupo?.id ?? null, {
        codigo: values.codigo,
        nombre: values.nombre,
        icono: values.icono ?? "",
        orden: values.orden,
        descripcion: values.descripcion ?? "",
      });
      onClose();
    },
    successMessage: editando ? "Grupo actualizado" : "Grupo creado",
    invalidateKeys: [moduleGroupsKey, queryKeys.adminModules],
  });

  const cerrar = () => {
    if (!mutation.isPending) onClose();
  };
  const enviar = handleSubmit((values) => mutation.mutate(values));

  return (
    <Modal
      open={open}
      onClose={cerrar}
      className="max-w-lg"
      header={
        <FormHeader
          title={editando ? "Editar grupo" : "Nuevo grupo"}
          description="Agrupa módulos relacionados, por ejemplo CRM o Meta."
          nombre={nombre}
          icono={icono}
        />
      }
      footer={
        <FormFooter
          onCancel={cerrar}
          onSubmit={enviar}
          loading={mutation.isPending}
          label={editando ? "Guardar cambios" : "Crear grupo"}
        />
      }
    >
      <form
        onSubmit={enviar}
        noValidate
        className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6"
      >
        <fieldset disabled={mutation.isPending} className="contents">
          <div>
            <Label htmlFor="grupo-codigo">Código *</Label>
            <Input
              id="grupo-codigo"
              placeholder="CRM"
              disabled={editando}
              error={Boolean(errors.codigo)}
              hint={errors.codigo?.message}
              {...register("codigo")}
            />
          </div>
          <div>
            <Label htmlFor="grupo-nombre">Nombre *</Label>
            <Input
              id="grupo-nombre"
              placeholder="CRM"
              error={Boolean(errors.nombre)}
              hint={errors.nombre?.message}
              {...register("nombre")}
            />
          </div>
          <div>
            <Label htmlFor="grupo-icono">Icono Iconify</Label>
            <Input
              id="grupo-icono"
              placeholder="mdi:account-group-outline"
              error={Boolean(errors.icono)}
              hint={errors.icono?.message}
              {...register("icono")}
            />
          </div>
          <div>
            <Label htmlFor="grupo-orden">Orden</Label>
            <Input
              id="grupo-orden"
              type="number"
              min={0}
              max={999}
              error={Boolean(errors.orden)}
              hint={errors.orden?.message}
              {...register("orden", { valueAsNumber: true })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="grupo-descripcion">Descripción</Label>
            <TextArea
              id="grupo-descripcion"
              rows={2}
              placeholder="Qué agrupa este grupo"
              error={Boolean(errors.descripcion)}
              hint={errors.descripcion?.message}
              {...register("descripcion")}
            />
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

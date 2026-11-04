"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import TextArea from "@/src/components/form/input/TextArea";
import Checkbox from "@/src/components/form/input/Checkbox";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import ConfirmModal from "@/src/components/ui/modal/ConfirmModal";
import Modal from "@/src/components/ui/modal/Modal";
import ModalFooter from "@/src/components/ui/modal/ModalFooter";
import ModalHeading from "@/src/components/ui/modal/ModalHeading";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { unwrapServerAction } from "@/src/lib/action-result";
import {
  desactivarRolEmpresa as desactivarRolEmpresaResult,
  getCatalogoPermisos as getCatalogoPermisosResult,
  getRolesEmpresa as getRolesEmpresaResult,
  guardarRolEmpresa as guardarRolEmpresaResult,
  restaurarRolEmpresa as restaurarRolEmpresaResult,
} from "./actions";
import type { GrupoPermisos, PermisoCatalogo, RolEmpresa } from "./types";

const getRolesEmpresa = unwrapServerAction(getRolesEmpresaResult);
const getCatalogoPermisos = unwrapServerAction(getCatalogoPermisosResult);
const guardarRolEmpresa = unwrapServerAction(guardarRolEmpresaResult);
const restaurarRolEmpresa = unwrapServerAction(restaurarRolEmpresaResult);
const desactivarRolEmpresa = unwrapServerAction(desactivarRolEmpresaResult);

/** Marcar un permiso agrega sus requeridos (como hace el backend al guardar). */
function conRequeridos(
  codigos: Iterable<string>,
  porCodigo: Map<string, PermisoCatalogo>,
) {
  const resultado = new Set<string>();
  const agregar = (codigo: string) => {
    if (resultado.has(codigo)) return;
    resultado.add(codigo);
    for (const r of porCodigo.get(codigo)?.requiere ?? []) agregar(r);
  };
  for (const c of codigos) agregar(c);
  return resultado;
}

/** Desmarcar un permiso quita también los que dependen de él. */
function sinDependientes(
  seleccion: Set<string>,
  quitado: string,
  porCodigo: Map<string, PermisoCatalogo>,
) {
  const resultado = new Set(seleccion);
  const quitar = (codigo: string) => {
    resultado.delete(codigo);
    for (const [c, p] of porCodigo)
      if (resultado.has(c) && p.requiere.includes(codigo)) quitar(c);
  };
  quitar(quitado);
  return resultado;
}

function etiquetaTipo(rol: RolEmpresa) {
  if (rol.codigo === "PROPIETARIO") return <Badge color="primary">Propietario</Badge>;
  if (rol.esSistema) return <Badge color="info">Sistema</Badge>;
  return <Badge color="warning">Personalizado</Badge>;
}

export default function RolesEmpresaView() {
  const [editor, setEditor] = useState<RolEmpresa | "nuevo" | null>(null);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [restaurar, setRestaurar] = useState<RolEmpresa | null>(null);
  const [eliminar, setEliminar] = useState<RolEmpresa | null>(null);

  const rolesQuery = useQuery({
    queryKey: queryKeys.organizationRoles,
    queryFn: () => getRolesEmpresa(),
  });
  const catalogoQuery = useQuery({
    queryKey: queryKeys.permisosCatalogo,
    queryFn: () => getCatalogoPermisos(),
  });
  const invalidar = [queryKeys.organizationRoles, queryKeys.me, ["organization-users"]];

  const guardar = useAppMutation({
    mutationFn: async ({
      id,
      datos,
    }: {
      id: string | null;
      datos: Parameters<typeof guardarRolEmpresa>[1];
    }) => {
      await guardarRolEmpresa(id, datos);
      setEditor(null);
    },
    successMessage: "Rol guardado",
    invalidateKeys: invalidar,
  });
  const restaurarMut = useAppMutation({
    mutationFn: async (rol: RolEmpresa) => {
      await restaurarRolEmpresa(rol.id);
      setRestaurar(null);
    },
    successMessage: "Rol restaurado a los permisos por defecto",
    invalidateKeys: invalidar,
  });
  const eliminarMut = useAppMutation({
    mutationFn: async (rol: RolEmpresa) => {
      await desactivarRolEmpresa(rol.id);
      setEliminar(null);
    },
    successMessage: "Rol eliminado",
    invalidateKeys: invalidar,
  });

  if (rolesQuery.isLoading || catalogoQuery.isLoading)
    return <PageLoader label="Cargando roles…" />;
  if (rolesQuery.isError) return <QueryError error={rolesQuery.error} />;
  if (catalogoQuery.isError) return <QueryError error={catalogoQuery.error} />;

  const roles = rolesQuery.data ?? [];
  const grupos: GrupoPermisos[] = catalogoQuery.data ?? [];
  const porCodigo = new Map(
    grupos.flatMap((g) => g.permisos.map((p) => [p.codigo, p] as const)),
  );
  const totalPermisos = porCodigo.size;
  const actual = editor && editor !== "nuevo" ? editor : null;
  const soloLectura = !!actual && !actual.editable;

  const abrirEditor = (rol: RolEmpresa | "nuevo") => {
    guardar.reset();
    setSeleccion(new Set(rol === "nuevo" ? [] : rol.permisos));
    setEditor(rol);
  };

  const alternar = (codigo: string, marcado: boolean) => {
    setSeleccion((previa) =>
      marcado
        ? conRequeridos([...previa, codigo], porCodigo)
        : sinDependientes(previa, codigo, porCodigo),
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const permisos = [...seleccion];
    guardar.mutate({
      id: actual?.id ?? null,
      datos: actual?.esSistema
        ? { permisos }
        : {
            nombre: String(f.get("nombre") ?? "").trim(),
            descripcion: String(f.get("descripcion") ?? "").trim() || null,
            permisos,
          },
    });
  };

  return (
    <div data-tour="roles-page" className="space-y-5">
      <PageHeader
        title="Roles y permisos"
        description="Define qué puede ver y hacer cada rol. Solo aparecen los módulos activos de tu plan."
        backHref="/settings"
        backLabel="Configuración"
      >
        <Button
          size="sm"
          startIcon={<Icon name="mdi:shield-plus-outline" size={18} />}
          onClick={() => abrirEditor("nuevo")}
        >
          Nuevo rol
        </Button>
      </PageHeader>

      <div
        data-tour="roles-list"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {roles.map((rol) => (
          <article
            key={rol.id}
            data-tour="role-card"
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                  {rol.nombre}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {etiquetaTipo(rol)}
                  {rol.esPropio && <Badge color="light">Tu rol</Badge>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <TableAction
                  icon={rol.editable ? "mdi:pencil-outline" : "mdi:eye-outline"}
                  label={rol.editable ? `Editar ${rol.nombre}` : `Ver ${rol.nombre}`}
                  onClick={() => abrirEditor(rol)}
                />
                {rol.esSistema && rol.codigo !== "PROPIETARIO" && rol.editable && (
                  <TableAction
                    icon="mdi:restore"
                    label={`Restaurar ${rol.nombre}`}
                    onClick={() => {
                      restaurarMut.reset();
                      setRestaurar(rol);
                    }}
                  />
                )}
                {!rol.esSistema && rol.editable && (
                  <TableAction
                    icon="mdi:trash-can-outline"
                    variant="danger"
                    label={`Eliminar ${rol.nombre}`}
                    onClick={() => {
                      eliminarMut.reset();
                      setEliminar(rol);
                    }}
                  />
                )}
              </div>
            </div>
            {rol.descripcion && (
              <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">
                {rol.descripcion}
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Icon name="mdi:account-multiple-outline" size={16} />
                {rol.usuarios} {rol.usuarios === 1 ? "usuario" : "usuarios"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="mdi:shield-check-outline" size={16} />
                {rol.permisos.length} de {totalPermisos} permisos
              </span>
            </div>
            {!rol.editable && rol.motivo && (
              <p className="mt-2 text-theme-xs text-gray-400">{rol.motivo}</p>
            )}
          </article>
        ))}
      </div>

      <Modal
        open={!!editor}
        onClose={() => {
          if (!guardar.isPending) setEditor(null);
        }}
        className="max-w-3xl"
        header={
          <ModalHeading
            title={
              !actual
                ? "Nuevo rol"
                : soloLectura
                  ? actual.nombre
                  : `Editar ${actual.nombre}`
            }
            icon={actual ? "mdi:shield-edit-outline" : "mdi:shield-plus-outline"}
          />
        }
        footer={
          <ModalFooter
            error={guardar.isError ? guardar.error.message : undefined}
          >
            <Button
              variant="outline"
              size="sm"
              disabled={guardar.isPending}
              onClick={() => setEditor(null)}
            >
              {soloLectura ? "Cerrar" : "Cancelar"}
            </Button>
            {!soloLectura && (
              <Button
                type="submit"
                form="rol-form"
                size="sm"
                loading={guardar.isPending}
                startIcon={<Icon name="mdi:content-save-outline" size={18} />}
              >
                Guardar rol
              </Button>
            )}
          </ModalFooter>
        }
      >
        <form
          id="rol-form"
          key={actual?.id ?? "nuevo"}
          onSubmit={submit}
          className="space-y-5 p-5"
        >
          <fieldset disabled={guardar.isPending} className="space-y-5">
            {soloLectura && actual?.motivo && (
              <p className="rounded-lg bg-gray-50 p-3 text-theme-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                {actual.motivo}
              </p>
            )}
            {!actual?.esSistema && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="rol-nombre">Nombre</Label>
                  <Input
                    id="rol-nombre"
                    name="nombre"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="Ej. Supervisor"
                    defaultValue={actual?.nombre ?? ""}
                    disabled={soloLectura}
                  />
                </div>
                <div>
                  <Label htmlFor="rol-descripcion">Descripción</Label>
                  <TextArea
                    id="rol-descripcion"
                    name="descripcion"
                    rows={2}
                    placeholder="Qué hace este rol en el equipo"
                    defaultValue={actual?.descripcion ?? ""}
                    disabled={soloLectura}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              {grupos.map((grupo) => {
                const marcados = grupo.permisos.filter((p) =>
                  seleccion.has(p.codigo),
                ).length;
                return (
                  <section
                    key={grupo.modulo ?? "EMPRESA"}
                    className="rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                      <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-gray-100">
                        {grupo.nombre}
                      </h3>
                      <span className="text-theme-xs text-gray-500">
                        {marcados} de {grupo.permisos.length}
                      </span>
                    </header>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {grupo.permisos.map((p) => (
                        <li key={p.codigo} className="px-4 py-3">
                          <Checkbox
                            id={`permiso-${p.codigo}`}
                            label={p.nombre}
                            checked={seleccion.has(p.codigo)}
                            disabled={soloLectura}
                            onChange={(marcado) => alternar(p.codigo, marcado)}
                          />
                          <p className="ml-8 mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                            {p.descripcion}
                            {p.requiere.length > 0 &&
                              ` Incluye: ${p.requiere
                                .map((r) => porCodigo.get(r)?.nombre ?? r)
                                .join(", ")}.`}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </fieldset>
        </form>
      </Modal>

      <ConfirmModal
        open={!!restaurar}
        title="Restaurar rol"
        icon="mdi:restore"
        description={`${restaurar?.nombre ?? ""} volverá a los permisos por defecto. Los usuarios con este rol verán el cambio en su siguiente acción.`}
        confirmLabel="Restaurar"
        loading={restaurarMut.isPending}
        error={restaurarMut.isError ? restaurarMut.error.message : undefined}
        onConfirm={() => restaurar && restaurarMut.mutate(restaurar)}
        onClose={() => {
          if (!restaurarMut.isPending) setRestaurar(null);
        }}
      />
      <ConfirmModal
        open={!!eliminar}
        title="Eliminar rol"
        icon="mdi:trash-can-outline"
        variant="danger"
        description={`Se eliminará el rol ${eliminar?.nombre ?? ""}. Solo es posible si ningún usuario activo lo tiene asignado.`}
        confirmLabel="Eliminar"
        loading={eliminarMut.isPending}
        error={eliminarMut.isError ? eliminarMut.error.message : undefined}
        onConfirm={() => eliminar && eliminarMut.mutate(eliminar)}
        onClose={() => {
          if (!eliminarMut.isPending) setEliminar(null);
        }}
      />
    </div>
  );
}

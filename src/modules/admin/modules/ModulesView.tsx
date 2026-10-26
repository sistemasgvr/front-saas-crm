"use client";

import Pagination from "@/src/components/ui/Pagination";
import { useClientPagination } from "@/src/components/ui/use-client-pagination";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import Badge, { StatusBadge } from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/ui/Icon";
import ConfirmModal from "@/src/components/ui/modal/ConfirmModal";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import {
  GroupFormModal,
  ModuleFormModal,
  moduleGroupsKey,
} from "./ModuleForms";
import {
  toggleModuleGroupStatusAction as toggleModuleGroupStatusActionResult,
  toggleModuleStatusAction as toggleModuleStatusActionResult,
} from "./actions";
import { getAdminModuleGroups, getAdminModules } from "./queries";
import AutomationIntegrationCard from "./AutomationIntegrationCard";
import type { ModuloAdmin, ModuloGrupo } from "../types";
import { unwrapServerAction } from "@/src/lib/action-result";
const toggleModuleGroupStatusAction = unwrapServerAction(toggleModuleGroupStatusActionResult);
const toggleModuleStatusAction = unwrapServerAction(toggleModuleStatusActionResult);


type FormularioModulo = { modulo: ModuloAdmin | null; grupoId?: string };
type CambioEstado =
  | { tipo: "grupo"; item: ModuloGrupo }
  | { tipo: "modulo"; item: ModuloAdmin };

const SIN_GRUPO = "sin-grupo";

export default function ModulesView() {
  const groupsQuery = useQuery({
    queryKey: moduleGroupsKey,
    queryFn: getAdminModuleGroups,
  });
  const modulesQuery = useQuery({
    queryKey: queryKeys.adminModules,
    queryFn: () => getAdminModules(),
  });

  const groupPage = useClientPagination(groupsQuery.data ?? [], 10);
  const [modulePages, setModulePages] = useState<Record<string, number>>({});
  const [formModulo, setFormModulo] = useState<FormularioModulo | null>(null);
  const [formGrupo, setFormGrupo] = useState<{ grupo: ModuloGrupo | null } | null>(
    null,
  );
  const [cambio, setCambio] = useState<CambioEstado | null>(null);

  const estadoMutation = useAppMutation({
    mutationFn: async (c: CambioEstado) => {
      const estado = c.item.estado === 1 ? 0 : 1;
      await (c.tipo === "grupo"
        ? toggleModuleGroupStatusAction(c.item.id, estado)
        : toggleModuleStatusAction(c.item.id, estado));
      setCambio(null);
    },
    invalidateKeys: [moduleGroupsKey, queryKeys.adminModules],
  });

  if (modulesQuery.isLoading || groupsQuery.isLoading) return <PageLoader />;
  if (modulesQuery.isError || groupsQuery.isError)
    return <QueryError error={modulesQuery.error ?? groupsQuery.error} />;

  const grupos = groupsQuery.data ?? [];
  const modulos = modulesQuery.data ?? [];
  const nombrePorCodigo = new Map(modulos.map((m) => [m.codigo, m.nombre]));
  const huerfanos = modulos.filter(
    (m) => !m.grupoId || !grupos.some((g) => g.id === m.grupoId),
  );

  const solicitarEstado = (c: CambioEstado) => {
    // Reactivar no tiene riesgo; retirar del catálogo corta el acceso de todas las empresas.
    if (c.item.estado === 1) setCambio(c);
    else estadoMutation.mutate(c);
  };

  const renderModulo = (modulo: ModuloAdmin) => {
    const activo = modulo.estado === 1;
    return (
      <li key={modulo.id} className="px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <Avatar
            name={modulo.nombre}
            icon={modulo.icono || "mdi:puzzle-outline"}
            shape="rounded"
            size="sm"
            className={activo ? "" : "opacity-50"}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {modulo.nombre}
              </p>
              <span className="font-mono text-theme-xs text-gray-400 dark:text-gray-500">
                {modulo.codigo}
              </span>
              {!activo && (
                <StatusBadge active={false} inactiveLabel="Retirado" />
              )}
            </div>
            {modulo.descripcion && (
              <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                {modulo.descripcion}
              </p>
            )}
            {modulo.requiere.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                  Requiere
                </span>
                {modulo.requiere.map((codigo) => (
                  <Badge
                    key={codigo}
                    color="light"
                    startIcon={<Icon name="mdi:link-variant" size={12} />}
                  >
                    {nombrePorCodigo.get(codigo) ?? codigo}
                  </Badge>
                ))}
              </div>
            )}
            {modulo.codigo === "AUTOMATIZACIONES" && (
              <AutomationIntegrationCard />
            )}
          </div>
          <div className="flex shrink-0 items-center">
            <TableAction
              icon="mdi:pencil-outline"
              label={`Editar ${modulo.nombre}`}
              onClick={() => setFormModulo({ modulo })}
            />
            <TableAction
              icon={activo ? "mdi:pause-circle-outline" : "mdi:play-circle-outline"}
              label={activo ? "Retirar del catálogo" : "Reactivar en el catálogo"}
              variant={activo ? "danger" : "default"}
              disabled={estadoMutation.isPending}
              onClick={() => solicitarEstado({ tipo: "modulo", item: modulo })}
            />
          </div>
        </div>
      </li>
    );
  };

  const renderGrupo = (grupo: ModuloGrupo | null, filas: ModuloAdmin[]) => {
    const groupId = grupo?.id ?? SIN_GRUPO;
    const totalPages = Math.max(1, Math.ceil(filas.length / 10));
    const page = Math.min(modulePages[groupId] ?? 1, totalPages);
    const visibles = filas.slice((page - 1) * 10, page * 10);
    const activo = grupo ? grupo.estado === 1 : true;
    const activos = filas.filter((m) => m.estado === 1).length;
    return (
      <section
        key={grupo?.id ?? SIN_GRUPO}
        className={`overflow-hidden rounded-2xl border bg-white dark:bg-white/[0.03] ${
          grupo
            ? "border-gray-200 dark:border-gray-800"
            : "border-dashed border-warning-300 dark:border-warning-500/40"
        }`}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5 dark:border-gray-800">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={grupo?.nombre ?? "Sin grupo"}
              icon={grupo ? grupo.icono || "mdi:folder-outline" : "mdi:folder-alert-outline"}
              shape="rounded"
              size="md"
              className={activo ? "" : "opacity-50"}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  {grupo?.nombre ?? "Sin grupo"}
                </h2>
                {grupo && (
                  <span className="font-mono text-theme-xs text-gray-400 dark:text-gray-500">
                    {grupo.codigo}
                  </span>
                )}
                {grupo && (
                  <StatusBadge
                    active={activo}
                    activeLabel="Activo"
                    inactiveLabel="Retirado"
                  />
                )}
              </div>
              <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                {grupo
                  ? grupo.descripcion ||
                    `${activos} de ${filas.length} módulos en el catálogo`
                  : "Asigna un grupo a estos módulos para que se muestren ordenados."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {grupo && (
              <Button
                size="sm"
                variant="outline"
                className="!px-3 !py-2"
                disabled={!activo}
                startIcon={<Icon name="mdi:plus" size={16} />}
                onClick={() => setFormModulo({ modulo: null, grupoId: grupo.id })}
              >
                Módulo
              </Button>
            )}
            {grupo && (
              <>
                <TableAction
                  icon="mdi:pencil-outline"
                  label={`Editar grupo ${grupo.nombre}`}
                  onClick={() => setFormGrupo({ grupo })}
                />
                <TableAction
                  icon={activo ? "mdi:pause-circle-outline" : "mdi:play-circle-outline"}
                  label={activo ? "Retirar grupo" : "Reactivar grupo"}
                  variant={activo ? "danger" : "default"}
                  disabled={estadoMutation.isPending}
                  onClick={() => solicitarEstado({ tipo: "grupo", item: grupo })}
                />
              </>
            )}
          </div>
        </header>
        {filas.length === 0 ? (
          <p className="px-5 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            Este grupo aún no tiene módulos.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {visibles.map(renderModulo)}
          </ul>
        )}
        <Pagination page={page} pageSize={10} total={filas.length} totalPages={totalPages} onPageChange={(next) => setModulePages((prev) => ({ ...prev, [groupId]: next }))} itemLabel="módulos" className="px-5 py-3" />
      </section>
    );
  };

  const descripcionCambio = (() => {
    if (!cambio) return "";
    if (cambio.tipo === "grupo") {
      return `Ninguna empresa podrá usar los módulos de "${cambio.item.nombre}" mientras esté retirado, aunque los tenga activados. Puedes reactivarlo cuando quieras.`;
    }
    const dependientes = modulos
      .filter((m) => m.estado === 1 && m.requiere.includes(cambio.item.codigo))
      .map((m) => m.nombre);
    return `Ninguna empresa podrá usar "${cambio.item.nombre}" mientras esté retirado.${
      dependientes.length
        ? ` También dejarán de funcionar los módulos que lo requieren: ${dependientes.join(", ")}.`
        : ""
    } Puedes reactivarlo cuando quieras.`;
  })();

  return (
    <div>
      <PageHeader
        title="Módulos"
        description="Catálogo de funcionalidades que se activan por empresa, organizadas por grupo."
      >
          <Button
            size="sm"
            variant="outline"
            startIcon={<Icon name="mdi:folder-plus-outline" size={18} />}
            onClick={() => setFormGrupo({ grupo: null })}
          >
            Nuevo grupo
          </Button>
          <Button
            size="sm"
            startIcon={<Icon name="mdi:plus" size={18} />}
            disabled={!grupos.some((g) => g.estado === 1)}
            onClick={() => setFormModulo({ modulo: null })}
          >
            Nuevo módulo
          </Button>
      </PageHeader>

      {grupos.length === 0 && modulos.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <EmptyState
            icon="mdi:puzzle-outline"
            title="Aún no hay grupos ni módulos. Crea un grupo para empezar."
          />
        </div>
      ) : (
        <div className="space-y-5">
          {groupPage.items.map((grupo) =>
            renderGrupo(
              grupo,
              modulos.filter((m) => m.grupoId === grupo.id),
            ),
          )}
          <Pagination {...groupPage.pagination} itemLabel="grupos" />
          {huerfanos.length > 0 && renderGrupo(null, huerfanos)}
        </div>
      )}

      <ModuleFormModal
        open={formModulo !== null}
        onClose={() => setFormModulo(null)}
        modulo={formModulo?.modulo}
        grupoIdInicial={formModulo?.grupoId}
        grupos={grupos}
        catalogo={modulos}
      />
      <GroupFormModal
        open={formGrupo !== null}
        onClose={() => setFormGrupo(null)}
        grupo={formGrupo?.grupo}
      />
      <ConfirmModal
        open={cambio !== null}
        variant="danger"
        icon="mdi:pause-circle-outline"
        title={
          cambio?.tipo === "grupo"
            ? `¿Retirar el grupo ${cambio.item.nombre}?`
            : `¿Retirar ${cambio?.item.nombre ?? ""} del catálogo?`
        }
        description={descripcionCambio}
        confirmLabel="Retirar"
        loading={estadoMutation.isPending}
        error={estadoMutation.error?.message}
        onConfirm={() => cambio && estadoMutation.mutate(cambio)}
        onClose={() => {
          if (estadoMutation.isPending) return;
          setCambio(null);
          estadoMutation.reset();
        }}
      />
    </div>
  );
}

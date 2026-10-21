"use client";
import { useState } from "react";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { queryKeys } from "@/src/lib/query/keys";
import {
  toggleOrganizationModuleAction,
  toggleOrganizationGroupAction,
} from "./actions";
import type { GrupoMatriz } from "../types";
import Switch from "@/src/components/form/switch/Switch";
import Avatar from "@/src/components/ui/avatar/Avatar";
import ConfirmModal from "@/src/components/ui/modal/ConfirmModal";
import Badge from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";
import { Spinner } from "@/src/components/ui/Spinner";
import WhatsappBotPanel from "./WhatsappBotPanel";

type Cambio = {
  id: string;
  grupo: boolean;
  habilitado: boolean;
  cascada: boolean;
  descripcion: string;
};
export default function ModulesMatrix({
  organizacionId,
  modulos: grupos,
  activa = true,
}: {
  organizacionId: string;
  modulos: GrupoMatriz[];
  activa?: boolean;
}) {
  const [confirmacion, setConfirmacion] = useState<Cambio | null>(null);
  const modulos = grupos.flatMap((g) => g.modulos);
  const mutation = useAppMutation({
    mutationFn: async (c: Cambio) => {
      await (c.grupo
        ? toggleOrganizationGroupAction(
            organizacionId,
            c.id,
            c.habilitado,
            c.cascada,
          )
        : toggleOrganizationModuleAction(
            organizacionId,
            c.id,
            c.habilitado,
            c.cascada,
          ));
      setConfirmacion(null);
    },
    invalidateKeys: [
      queryKeys.adminOrganizationModules(organizacionId),
      queryKeys.adminWhatsappBot(organizacionId),
      queryKeys.whatsappBotPreferencias,
      queryKeys.me,
    ],
    successMessage: "Permisos actualizados",
  });
  function requiere(codigo: string, vistos = new Set<string>()): Set<string> {
    if (vistos.has(codigo)) return vistos;
    vistos.add(codigo);
    for (const c of modulos.find((m) => m.codigo === codigo)?.requiere ?? [])
      requiere(c, vistos);
    return vistos;
  }
  function proponer(id: string, grupo: boolean, habilitado: boolean) {
    const seleccion = grupo
      ? grupos.find((g) => g.grupo.id === id)!.modulos
      : modulos.filter((m) => m.id === id);
    const codigos = new Set(seleccion.map((m) => m.codigo));
    const afectados = new Set<string>();
    if (habilitado)
      for (const m of seleccion)
        for (const c of requiere(m.codigo))
          if (
            !codigos.has(c) &&
            !modulos.find((m) => m.codigo === c)?.habilitado
          )
            afectados.add(c);
    if (!habilitado)
      for (const m of modulos.filter(
        (m) => m.habilitado && !codigos.has(m.codigo),
      ))
        if ([...requiere(m.codigo)].some((c) => codigos.has(c)))
          afectados.add(m.codigo);
    const nombres = [...afectados].map(
      (c) => modulos.find((m) => m.codigo === c)?.nombre ?? c,
    );
    const c: Cambio = {
      id,
      grupo,
      habilitado,
      cascada: !habilitado && afectados.size > 0,
      descripcion: nombres.length
        ? (habilitado ? "También se activará: " : "También se desactivará: ") +
          nombres.join(", ") +
          "."
        : `Se ${habilitado ? "activarán" : "desactivarán"} todos los módulos de ${
            grupos.find((g) => g.grupo.id === id)?.grupo.nombre ?? "este grupo"
          }.`,
    };
    if (nombres.length || grupo) setConfirmacion(c);
    else mutation.mutate(c);
  }
  const nombreDe = (codigo: string) =>
    modulos.find((m) => m.codigo === codigo)?.nombre ?? codigo;
  const enCurso = mutation.isPending ? mutation.variables?.id : undefined;
  return (
    <div className="space-y-4">
      {grupos.map(({ grupo, modulos: filas, habilitado }) => {
        const activos = filas.filter((m) => m.habilitado).length;
        return (
          <section
            key={grupo.id}
            className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-4 py-3 dark:bg-white/[0.02]">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  name={grupo.nombre}
                  icon={grupo.icono || "mdi:folder-outline"}
                  shape="rounded"
                  size="md"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                      {grupo.nombre}
                    </h3>
                    <Badge
                      color={
                        habilitado === "todos"
                          ? "success"
                          : habilitado === "parcial"
                            ? "warning"
                            : "light"
                      }
                    >
                      {habilitado === "todos"
                        ? "Activo"
                        : habilitado === "parcial"
                          ? "Parcial"
                          : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                    {activos} de {filas.length} módulos activos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {enCurso === grupo.id && <Spinner size={14} />}
                <Switch
                  label={habilitado === "todos" ? "Todo el grupo" : "Activar todo"}
                  checked={habilitado === "todos"}
                  disabled={mutation.isPending || !filas.length}
                  onChange={(v) => proponer(grupo.id, true, v)}
                />
              </div>
            </header>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {filas.map((m) => (
                <li key={m.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar
                        name={m.nombre}
                        icon={m.icono || "mdi:puzzle-outline"}
                        shape="rounded"
                        size="sm"
                        className={m.habilitado ? "" : "opacity-50"}
                      />
                      <div className="min-w-0">
                        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {m.nombre}
                        </p>
                        {m.descripcion && (
                          <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                            {m.descripcion}
                          </p>
                        )}
                        {m.requiere.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                              Requiere
                            </span>
                            {m.requiere.map((c) => (
                              <Badge
                                key={c}
                                color="light"
                                startIcon={<Icon name="mdi:link-variant" size={12} />}
                              >
                                {nombreDe(c)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pt-0.5">
                      {enCurso === m.id && <Spinner size={14} />}
                      <Switch
                        label={m.habilitado ? "Activo" : "Inactivo"}
                        checked={m.habilitado}
                        disabled={mutation.isPending}
                        onChange={(v) => proponer(m.id, false, v)}
                      />
                    </div>
                  </div>
                  {m.codigo === "AUTOMATIZACIONES" && (
                    <div className="mt-3 border-l-2 border-gray-100 pl-4 sm:ml-11 dark:border-gray-800">
                      <WhatsappBotPanel
                        id={organizacionId}
                        activa={activa}
                        automatizacionesHabilitado={m.habilitado}
                        whatsappHabilitado={modulos.some(
                          (x) => x.codigo === "WHATSAPP" && x.habilitado,
                        )}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <ConfirmModal
        open={!!confirmacion}
        title={
          confirmacion?.habilitado ? "¿Activar módulos?" : "¿Desactivar módulos?"
        }
        description={confirmacion?.descripcion ?? ""}
        variant={confirmacion?.habilitado === false ? "danger" : "brand"}
        icon={confirmacion?.habilitado === false ? "mdi:toggle-switch-off-outline" : "mdi:toggle-switch-outline"}
        confirmLabel={confirmacion?.habilitado === false ? "Desactivar" : "Activar"}
        loading={mutation.isPending}
        error={mutation.error?.message}
        onClose={() => {
          if (!mutation.isPending) {
            setConfirmacion(null);
            mutation.reset();
          }
        }}
        onConfirm={() => {
          if (confirmacion) mutation.mutate(confirmacion);
        }}
      />
    </div>
  );
}

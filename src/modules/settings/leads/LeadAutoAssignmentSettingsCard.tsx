"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Label from "@/src/components/form/Label";
import Select from "@/src/components/form/Select";
import Switch from "@/src/components/form/switch/Switch";
import Button from "@/src/components/ui/button/Button";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import HelpTooltip from "@/src/components/ui/HelpTooltip";
import { Icon } from "@/src/components/ui/Icon";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { queryKeys } from "@/src/lib/query/keys";
import { getAsignables } from "@/src/modules/leads/queries";
import { getLeadAutoAsignacionConfig } from "./queries";
import { updateLeadAutoAsignacionConfigAction, type UpdateLeadAutoAsignacionConfigInput } from "./actions";
import type { LeadAutoAsignacionConfig } from "./types";

type FormState = {
  habilitado: boolean;
  usuarioIds: string[];
  limitesDiarios: Record<string, string>;
};

function usuarioIdsFromConfig(cfg: LeadAutoAsignacionConfig): string[] {
  if (Array.isArray(cfg.usuarioIds)) return cfg.usuarioIds;

  const ids: string[] = [];
  if (cfg.usuarioPrimeroId) ids.push(cfg.usuarioPrimeroId);
  if (cfg.usuarioSegundoId) ids.push(cfg.usuarioSegundoId);
  return ids;
}

function formFromConfig(cfg: LeadAutoAsignacionConfig): FormState {
  return {
    habilitado: cfg.habilitado,
    usuarioIds: usuarioIdsFromConfig(cfg),
    limitesDiarios: Object.fromEntries(Object.entries(cfg.limitesDiarios ?? {}).map(([id, n]) => [id, String(n)])),
  };
}

function moverItem(ids: string[], index: number, delta: number): string[] {
  const next = [...ids];
  const destino = index + delta;
  if (destino < 0 || destino >= next.length) return ids;
  const [item] = next.splice(index, 1);
  next.splice(destino, 0, item);
  return next;
}

export default function LeadAutoAssignmentSettingsCard() {
  const configQuery = useQuery({
    queryKey: queryKeys.leadAutoAsignacionConfig,
    queryFn: getLeadAutoAsignacionConfig,
    refetchInterval: 30_000,
  });

  const asignablesQuery = useQuery({
    queryKey: queryKeys.leadsAsignables,
    queryFn: getAsignables,
    enabled: true,
  });

  const [draft, setDraft] = useState<FormState | null>(null);
  const form = useMemo(() => draft ?? (configQuery.data ? formFromConfig(configQuery.data) : {
    habilitado: false, usuarioIds: [], limitesDiarios: {},
  }), [draft, configQuery.data]);
  const setForm = (update: (current: FormState) => FormState) => {
    setDraft((current) => update(current ?? form));
  };
  const [usuarioPendiente, setUsuarioPendiente] = useState("");

  const asignablesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of asignablesQuery.data ?? []) {
      map.set(u.id, u.nombre);
    }
    return map;
  }, [asignablesQuery.data]);

  const disponibles = useMemo(
    () =>
      (asignablesQuery.data ?? [])
        .filter((u: { id: string; nombre: string }) => !form.usuarioIds.includes(u.id))
        .map((u: { id: string; nombre: string }) => ({ value: u.id, label: u.nombre })),
    [asignablesQuery.data, form.usuarioIds],
  );

  const siguienteDestinoId = useMemo(() => {
    if (!form.habilitado) return null;
    const indice = configQuery.data?.siguienteIndice ?? 0;
    if (!Number.isFinite(indice) || indice < 0) return null;
    for (let offset = 0; offset < form.usuarioIds.length; offset++) {
      const id = form.usuarioIds[(indice + offset) % form.usuarioIds.length];
      const limite = form.limitesDiarios[id];
      if (!limite || (configQuery.data?.asignadosHoy?.[id] ?? 0) < Number(limite)) return id;
    }
    return null;
  }, [configQuery.data, form]);

  const preview = useMemo(() => {
    if (!form.habilitado) return "Deshabilitada";
    const nombres = form.usuarioIds.map((id) => asignablesById.get(id)).filter(Boolean);
    if (nombres.length === 0) return "Sin usuarios";
    return nombres.join(" → ");
  }, [asignablesById, form.habilitado, form.usuarioIds]);

  const limitesValidos = form.usuarioIds.every((id) => {
    const valor = form.limitesDiarios[id];
    return !valor || (/^\d+$/.test(valor) && Number.isSafeInteger(Number(valor)) && Number(valor) >= 1);
  });

  const mutation = useAppMutation({
    mutationFn: () => {
      if (form.habilitado && form.usuarioIds.length < 1) {
        toast.error("Agrega al menos 1 usuario para habilitar el auto-reparto");
        return Promise.reject(new Error("Faltan usuarios"));
      }

      if (!limitesValidos) return Promise.reject(new Error("Los límites deben ser enteros positivos"));
      const payload: UpdateLeadAutoAsignacionConfigInput = {
        habilitado: form.habilitado,
        usuarioIds: form.usuarioIds,
        limitesDiarios: Object.fromEntries(form.usuarioIds.filter((id) => form.limitesDiarios[id]).map((id) => [id, Number(form.limitesDiarios[id])])),
      };
      return updateLeadAutoAsignacionConfigAction(payload);
    },
    successMessage: "Configuración guardada",
    invalidateKeys: [queryKeys.leadAutoAsignacionConfig],
  });

  const puedeGuardar = (!form.habilitado || form.usuarioIds.length >= 1) && limitesValidos;

  const agregarUsuario = () => {
    if (!usuarioPendiente) return;
    setForm((f) => {
      if (f.usuarioIds.includes(usuarioPendiente)) return f;
      return { ...f, usuarioIds: [...f.usuarioIds, usuarioPendiente] };
    });
    setUsuarioPendiente("");
  };

  const quitarUsuario = (id: string) => {
    setForm((f) => ({ ...f, usuarioIds: f.usuarioIds.filter((uid) => uid !== id) }));
  };

  if (configQuery.isLoading || asignablesQuery.isLoading) {
    return (
      <CollapsibleSection
        title="Asignación automática de leads"
        icon="mdi:account-switch-outline"
        defaultOpen={false}
      >
        <PageLoader label="Cargando auto-asignación…" />
      </CollapsibleSection>
    );
  }
  if (configQuery.isError) return <QueryError error={configQuery.error} />;
  if (asignablesQuery.isError) return <QueryError error={asignablesQuery.error} />;

  return (
    <CollapsibleSection
      title="Asignación automática de leads"
      icon="mdi:account-switch-outline"
      help="Cuando llega un lead NUEVO, se asigna en ese orden (1, 2, 3…) y vuelve al primero. El aviso de “Nuevo lead” llega solo al responsable asignado."
      preview={preview}
      badge={form.habilitado ? "Activa" : "Inactiva"}
      badgeColor={form.habilitado ? "success" : "light"}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Switch label="Habilitar" checked={form.habilitado} onChange={(checked) => setForm((f) => ({ ...f, habilitado: checked }))} />
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
            Próximo lead:{" "}
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {form.habilitado ? (siguienteDestinoId ? asignablesById.get(siguienteDestinoId) ?? "—" : "Sin cupo disponible") : "—"}
            </span>
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Label className="mb-0">Orden de asignación</Label>
            <HelpTooltip
              content="El primer usuario de la lista recibe el primer lead, el segundo el siguiente, y así sucesivamente. Usa las flechas para cambiar el orden."
              placement="bottom"
            />
          </div>

          {form.usuarioIds.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-theme-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Aún no hay asesores. Agrégalos uno a uno en el orden en que deben recibir leads.
            </p>
          ) : (
            <ol className="space-y-2">
              {form.usuarioIds.map((id, idx) => (
                <li
                  key={id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-theme-sm text-gray-800 dark:text-white/90">
                    {asignablesById.get(id) ?? "—"}
                  </span>
                  <div className="flex items-center gap-2">
                    <label htmlFor={`limite-${id}`} className="text-theme-xs text-gray-500">Máximo por día</label>
                    <input id={`limite-${id}`} type="number" min={1} step={1} placeholder="Sin límite"
                      value={form.limitesDiarios[id] ?? ""}
                      onChange={(event) => setForm((f) => ({ ...f, limitesDiarios: { ...f.limitesDiarios, [id]: event.target.value } }))}
                      className="w-28 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-theme-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <span className="text-theme-xs text-gray-500">{configQuery.data?.asignadosHoy?.[id] ?? 0} hoy</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      aria-label="Subir en el orden"
                      className="rounded-md p-1 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-gray-200"
                      onClick={() => setForm((f) => ({ ...f, usuarioIds: moverItem(f.usuarioIds, idx, -1) }))}
                    >
                      <Icon name="mdi:chevron-up" size={18} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === form.usuarioIds.length - 1}
                      aria-label="Bajar en el orden"
                      className="rounded-md p-1 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-gray-200"
                      onClick={() => setForm((f) => ({ ...f, usuarioIds: moverItem(f.usuarioIds, idx, 1) }))}
                    >
                      <Icon name="mdi:chevron-down" size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Quitar de la lista"
                      className="rounded-md p-1 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                      onClick={() => quitarUsuario(id)}
                    >
                      <Icon name="mdi:close" size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1">
              <Select
                id="agregar-usuario-round-robin"
                options={disponibles}
                value={usuarioPendiente}
                placeholder={disponibles.length ? "Elegir usuario para agregar…" : "No hay más usuarios"}
                disabled={disponibles.length === 0}
                onChange={setUsuarioPendiente}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!usuarioPendiente}
              startIcon={<Icon name="mdi:plus" size={18} />}
              onClick={agregarUsuario}
            >
              Agregar
            </Button>
          </div>
        </div>

        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
          Deja el máximo vacío para recibir leads sin límite. Solo cuentan las asignaciones automáticas.
          Los cupos se reinician a medianoche (hora de Lima). Al agotarse, se salta al usuario;
          si nadie tiene cupo, los leads quedan sin asignar para gestión manual.
        </p>
        {!limitesValidos && <p role="alert" className="text-theme-xs text-error-600">Los máximos deben ser números enteros mayores que cero.</p>}
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            loading={mutation.isPending}
            disabled={!puedeGuardar || mutation.isPending}
            startIcon={<Icon name="mdi:content-save-outline" size={18} />}
            onClick={() => {
              if (!puedeGuardar) {
                toast.error("Agrega al menos 1 usuario válidos");
                return;
              }
              mutation.mutate(undefined, { onSuccess: () => setDraft(null) });
            }}
          >
            {mutation.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  );
}

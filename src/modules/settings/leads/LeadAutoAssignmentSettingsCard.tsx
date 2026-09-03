"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Switch from "@/src/components/form/switch/Switch";
import MultiSelect from "@/src/components/form/MultiSelect";
import Button from "@/src/components/ui/button/Button";
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
};

function usuarioIdsFromConfig(cfg: LeadAutoAsignacionConfig): string[] {
  if (Array.isArray(cfg.usuarioIds)) return cfg.usuarioIds;

  // Legacy (round-robin 2) -> convierte a lista.
  const ids: string[] = [];
  if (cfg.usuarioPrimeroId) ids.push(cfg.usuarioPrimeroId);
  if (cfg.usuarioSegundoId) ids.push(cfg.usuarioSegundoId);
  return ids;
}

function formFromConfig(cfg: LeadAutoAsignacionConfig): FormState {
  return {
    habilitado: cfg.habilitado,
    usuarioIds: usuarioIdsFromConfig(cfg),
  };
}

export default function LeadAutoAssignmentSettingsCard() {
  const configQuery = useQuery({
    queryKey: queryKeys.leadAutoAsignacionConfig,
    queryFn: getLeadAutoAsignacionConfig,
  });

  const asignablesQuery = useQuery({
    queryKey: queryKeys.leadsAsignables,
    queryFn: getAsignables,
    enabled: true,
  });

  const [form, setForm] = useState<FormState>({
    habilitado: false,
    usuarioIds: [],
  });

  useEffect(() => {
    if (!configQuery.data) return;
    setForm(formFromConfig(configQuery.data));
  }, [configQuery.data]);

  const multiOptions = useMemo<{ value: string; text: string; selected: boolean }[]>(() => {
    return (asignablesQuery.data ?? []).map((u: { id: string; nombre: string }) => ({
      value: u.id,
      text: u.nombre,
      selected: false,
    }));
  }, [asignablesQuery.data]);

  const siguienteDestinoId = useMemo(() => {
    if (!form.habilitado) return null;
    const indice = configQuery.data?.siguienteIndice ?? 0;
    if (!Number.isFinite(indice) || indice < 0) return null;

    return form.usuarioIds[indice] ?? null;
  }, [configQuery.data?.siguienteIndice, form.habilitado, form.usuarioIds]);

  const asignablesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of asignablesQuery.data ?? []) {
      map.set(u.id, u.nombre);
    }
    return map;
  }, [asignablesQuery.data]);

  const mutation = useAppMutation({
    mutationFn: () => {
      if (form.habilitado) {
        if (form.usuarioIds.length < 2) {
          toast.error("Selecciona al menos 2 usuarios para habilitar el auto-reparto");
          return Promise.reject(new Error("Faltan usuarios"));
        }
      }

      const payload: UpdateLeadAutoAsignacionConfigInput = {
        habilitado: form.habilitado,
        usuarioIds: form.usuarioIds,
      };
      return updateLeadAutoAsignacionConfigAction(payload);
    },
    successMessage: "Configuración guardada",
    invalidateKeys: [queryKeys.leadAutoAsignacionConfig],
  });

  const puedeGuardar = useMemo(() => {
    // El DTO backend exige UUIDs/ids incluso cuando `habilitado=false`.
    // Mantiene compatibilidad con el round-robin secuencial (mínimo 2 usuarios).
    return form.usuarioIds.length >= 2;
  }, [form.usuarioIds.length]);

  const activarSwitch = (checked: boolean) => {
    if (!checked) {
      setForm((f) => ({ ...f, habilitado: false }));
      return;
    }

    setForm((f) => {
      // Si habilitan con menos de 2 usuarios, completamos con los primeros asignables.
      if (f.usuarioIds.length >= 2) {
        return { ...f, habilitado: true };
      }

      const idsFromDefaults = multiOptions.slice(0, 2).map((o) => o.value);
      return { ...f, habilitado: true, usuarioIds: idsFromDefaults };
    });
  };

  if (configQuery.isLoading || asignablesQuery.isLoading) return <PageLoader label="Cargando auto-asignación…" />;
  if (configQuery.isError) return <QueryError error={configQuery.error} />;
  if (asignablesQuery.isError) return <QueryError error={asignablesQuery.error} />;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Icon name="mdi:auto-fix-outline" size={22} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Asignación automática de leads
            </h2>
            <p className="mt-1 max-w-xl text-theme-sm text-gray-500 dark:text-gray-400">
              Cuando llega un lead NUEVO, se asigna en round-robin secuencial entre los usuarios configurados (N).
              El aviso de “Nuevo lead” llega solo al responsable asignado automáticamente.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Switch label="Habilitar" checked={form.habilitado} onChange={activarSwitch} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MultiSelect
            label="Usuarios del round-robin"
            options={multiOptions}
            defaultSelected={form.usuarioIds}
            onChange={(ids) => setForm((f) => ({ ...f, usuarioIds: ids }))}
            disabled={!form.habilitado}
            placeholder={multiOptions.length ? "Selecciona usuarios…" : "Sin miembros"}
          />

          {form.usuarioIds.length > 0 ? (
            <div className="mt-4">
              <p className="text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                Orden de auto-asignación (1 → {form.usuarioIds.length})
              </p>
              <ol className="mt-2 space-y-2">
                {form.usuarioIds.map((id, idx) => (
                  <li key={id} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 text-theme-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span className="text-theme-sm text-gray-800 dark:text-white/90">
                      {asignablesById.get(id) ?? "—"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-theme-xs font-medium text-gray-600 dark:text-gray-300">Próximo lead:</p>
            <p className="mt-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
              {form.habilitado && siguienteDestinoId ? asignablesById.get(siguienteDestinoId) ?? "—" : "—"}
            </p>
            <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
              {form.habilitado ? "Asignación automática en secuencia." : "Habilita para ver el próximo responsable."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          size="sm"
          loading={mutation.isPending}
          disabled={!puedeGuardar || mutation.isPending}
          startIcon={<Icon name="mdi:content-save-outline" size={18} />}
          onClick={() => {
            if (!puedeGuardar) {
              toast.error("Selecciona al menos 2 usuarios válidos");
              return;
            }
            mutation.mutate();
          }}
        >
          {mutation.isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}


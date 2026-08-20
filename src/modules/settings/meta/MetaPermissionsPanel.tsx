"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import Checkbox from "@/src/components/form/input/Checkbox";
import Switch from "@/src/components/form/switch/Switch";
import { Icon } from "@/src/components/ui/Icon";
import { PageLoader } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { getMetaPermissions } from "./queries";
import { grantMetaFeatureAction, reconnectMetaAction, toggleMetaFeatureAction } from "./actions";
import type { FeaturePermisoEstado } from "./types";

function ConfirmOffPanel({ feature, onCancel }: { feature: FeaturePermisoEstado; onCancel: () => void }) {
  const [revocar, setRevocar] = useState(false);

  const toggleOff = useAppMutation({
    mutationFn: () => toggleMetaFeatureAction(feature.id, false, revocar),
    successMessage: "Dejamos de solicitar este permiso",
    invalidateKeys: [queryKeys.metaPermissions],
  });

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-theme-xs text-gray-600 dark:text-gray-300">
        ¿Dejar de usar &quot;{feature.label}&quot;? No se volverá a pedir en la próxima reconexión.
      </p>
      <div className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
        <Checkbox
          checked={revocar}
          onChange={setRevocar}
          label="También revocar el permiso ya otorgado en Meta ahora mismo"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="danger"
          loading={toggleOff.isPending}
          disabled={toggleOff.isPending}
          onClick={() => toggleOff.mutate(undefined, { onSuccess: onCancel })}
        >
          Confirmar
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={toggleOff.isPending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function FeatureRow({
  feature,
  confirmandoOff,
  onRequestOff,
  onCancelOff,
}: {
  feature: FeaturePermisoEstado;
  confirmandoOff: boolean;
  onRequestOff: (id: string) => void;
  onCancelOff: () => void;
}) {
  const toggleOn = useAppMutation({
    mutationFn: () => toggleMetaFeatureAction(feature.id, true),
    successMessage: "Preferencia actualizada",
    invalidateKeys: [queryKeys.metaPermissions],
  });

  return (
    <li className="py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-theme-sm text-gray-700 dark:text-gray-300">{feature.label}</p>
          {feature.estado === "falta" && feature.deseada && (
            <p className="text-theme-xs text-gray-400">Falta: {feature.scopesFaltantes.join(", ")}</p>
          )}
          {feature.tipo === "optin" && feature.deseada && feature.estado === "falta" && (
            <form action={grantMetaFeatureAction.bind(null, feature.id)} className="mt-1">
              <button type="submit" className="text-theme-xs font-medium text-brand-500 hover:underline">
                Otorgar en Meta
              </button>
            </form>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Badge color={feature.estado === "ok" ? "success" : feature.deseada ? "error" : "light"} size="sm">
            {feature.estado === "ok" ? "OK" : "Falta"}
          </Badge>
          {feature.tipo === "nucleo" ? (
            <span className="text-theme-xs text-gray-400">Núcleo</span>
          ) : (
            <Switch
              label=""
              checked={feature.deseada}
              disabled={toggleOn.isPending}
              onChange={(checked) => {
                if (checked) {
                  toggleOn.mutate();
                } else {
                  onRequestOff(feature.id);
                }
              }}
            />
          )}
        </div>
      </div>
      {confirmandoOff && <ConfirmOffPanel feature={feature} onCancel={onCancelOff} />}
    </li>
  );
}

export default function MetaPermissionsPanel() {
  const queryClient = useQueryClient();
  const [confirmOffId, setConfirmOffId] = useState<string | null>(null);

  const { data: resultado, isLoading } = useQuery({
    queryKey: queryKeys.metaPermissions,
    queryFn: () => getMetaPermissions(),
  });

  const salud = resultado?.ok ? resultado.data : undefined;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Permisos Meta</h3>
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.metaPermissions })}
          className="inline-flex items-center gap-1 text-theme-xs font-medium text-brand-500 hover:underline"
        >
          <Icon name="mdi:refresh" size={14} />
          Actualizar permisos
        </button>
      </div>

      {isLoading ? (
        <PageLoader label="Verificando permisos…" />
      ) : resultado && !resultado.ok ? (
        <p className="text-sm text-error-500" role="alert">
          {resultado.message}
        </p>
      ) : (
        salud && (
          <div className="space-y-4">
            {!salud.isValid && (
              <p className="rounded-lg bg-error-50 px-3 py-2 text-theme-xs text-error-600 dark:bg-error-500/10 dark:text-error-400">
                El token de Meta ya no es válido — reconecta para restaurar el acceso.
              </p>
            )}

            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {salud.features.map((feature) => (
                <FeatureRow
                  key={feature.id}
                  feature={feature}
                  confirmandoOff={confirmOffId === feature.id}
                  onRequestOff={setConfirmOffId}
                  onCancelOff={() => setConfirmOffId(null)}
                />
              ))}
            </ul>

            {salud.tieneFaltantesDeseados && (
              <div className="rounded-lg bg-warning-50 px-3 py-3 dark:bg-warning-500/10">
                <p className="mb-2 text-theme-xs text-warning-700 dark:text-warning-400">
                  Faltan permisos deseados. Reconecta y acepta todos los permisos solicitados.
                </p>
                <form action={reconnectMetaAction}>
                  <Button type="submit" size="sm" startIcon={<Icon name="mdi:facebook" size={16} />}>
                    Reconectar Meta
                  </Button>
                </form>
              </div>
            )}

            <p className="text-theme-xs text-gray-400">{salud.notaAdvancedAccess}</p>
          </div>
        )
      )}
    </div>
  );
}

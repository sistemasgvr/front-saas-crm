"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
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
import { grantMetaFeatureAction as grantMetaFeatureActionResult, requestMetaPermissionsAction as requestMetaPermissionsActionResult, toggleMetaFeatureAction as toggleMetaFeatureActionResult } from "./actions";
import type { FeaturePermisoEstado, GrupoPermisoMeta } from "./types";
import { unwrapServerAction } from "@/src/lib/action-result";
import { withFormFeedback } from "@/src/lib/form-action";
const grantMetaFeatureAction = unwrapServerAction(grantMetaFeatureActionResult);
const requestMetaPermissionsAction = unwrapServerAction(requestMetaPermissionsActionResult);
const toggleMetaFeatureAction = unwrapServerAction(toggleMetaFeatureActionResult);


/** Orden y títulos de los grupos requeridos; los grupos llegan del back
 * (meta-permisos-matriz.ts), así que agregar un permiso allá no toca esta vista. */
const GRUPOS_REQUERIDOS: { id: Exclude<GrupoPermisoMeta, "opcional">; titulo: string }[] = [
  { id: "paginas_leads", titulo: "Páginas y Lead Ads" },
  { id: "publicidad", titulo: "Publicidad y estadísticas" },
  { id: "negocio", titulo: "Portafolio comercial" },
  { id: "whatsapp", titulo: "WhatsApp Business" },
];

function SolicitarPermisosButton({ variant }: { variant: "primary" | "outline" }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      variant={variant}
      loading={pending}
      disabled={pending}
      startIcon={<Icon name="mdi:shield-key-outline" size={16} />}
    >
      Solicitar permisos
    </Button>
  );
}

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
        ¿Dejar de usar &quot;{feature.label}&quot;? No se volverá a pedir en la próxima solicitud de permisos.
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

  const requerido = feature.tipo === "nucleo";

  return (
    <li className="py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-theme-sm text-gray-700 dark:text-gray-300">{feature.label}</p>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">{feature.descripcion}</p>
          <p className="mt-0.5 font-mono text-[11px] text-gray-400">
            {feature.estado === "falta" && feature.deseada
              ? `Falta: ${feature.scopesFaltantes.join(", ")}`
              : feature.scopesRequeridos.join(", ")}
          </p>
          {!requerido && feature.deseada && feature.estado === "falta" && (
            <form action={withFormFeedback(() => grantMetaFeatureAction(feature.id))} className="mt-1">
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
          {requerido ? (
            <span className="text-theme-xs text-gray-400">Requerido</span>
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
  const requeridas = salud?.features.filter((f) => f.tipo === "nucleo") ?? [];
  const requeridasOk = requeridas.filter((f) => f.estado === "ok").length;
  const opcionales = salud?.features.filter((f) => f.tipo === "optin") ?? [];
  const todoOtorgado = salud ? salud.isValid && !salud.tieneFaltantesDeseados : false;

  const renderFila = (feature: FeaturePermisoEstado) => (
    <FeatureRow
      key={feature.id}
      feature={feature}
      confirmandoOff={confirmOffId === feature.id}
      onRequestOff={setConfirmOffId}
      onCancelOff={() => setConfirmOffId(null)}
    />
  );

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
          Actualizar estado
        </button>
      </div>

      {isLoading ? (
        <PageLoader label="Verificando permisos…" />
      ) : resultado && !resultado.ok ? (
        <div className="space-y-3">
          <p className="text-sm text-error-500" role="alert">
            {resultado.message}
          </p>
          <form action={withFormFeedback(requestMetaPermissionsAction)}>
            <SolicitarPermisosButton variant="primary" />
          </form>
        </div>
      ) : (
        salud && (
          <div className="space-y-4">
            <div
              className={`rounded-lg px-3 py-3 ${
                todoOtorgado ? "bg-success-50 dark:bg-success-500/10" : "bg-warning-50 dark:bg-warning-500/10"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-theme-xs">
                  {!salud.isValid ? (
                    <p className="font-medium text-error-600 dark:text-error-400">
                      El token de Meta ya no es válido — solicita los permisos de nuevo para restaurar el acceso.
                    </p>
                  ) : todoOtorgado ? (
                    <p className="font-medium text-success-700 dark:text-success-400">
                      Todos los permisos requeridos están otorgados ({requeridasOk} de {requeridas.length}).
                    </p>
                  ) : (
                    <p className="font-medium text-warning-700 dark:text-warning-400">
                      {salud.scopesRequeridosFaltantes.length > 0
                        ? `Faltan ${salud.scopesRequeridosFaltantes.length} permisos requeridos (${requeridasOk} de ${requeridas.length} OK).`
                        : "Faltan permisos opcionales que activaste."}{" "}
                      Pulsa «Solicitar permisos» y acepta todo en el diálogo de Meta.
                    </p>
                  )}
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Se piden juntos en un solo diálogo de Meta ({salud.scopesSolicitados.length} permisos).
                  </p>
                </div>
                <form action={withFormFeedback(requestMetaPermissionsAction)} className="shrink-0">
                  <SolicitarPermisosButton variant={todoOtorgado ? "outline" : "primary"} />
                </form>
              </div>
            </div>

            {GRUPOS_REQUERIDOS.map((grupo) => {
              const filas = requeridas.filter((f) => f.grupo === grupo.id);
              if (filas.length === 0) return null;
              return (
                <div key={grupo.id}>
                  <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400">{grupo.titulo}</p>
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">{filas.map(renderFila)}</ul>
                </div>
              );
            })}

            {opcionales.length > 0 && (
              <details className="text-theme-xs text-gray-500 dark:text-gray-400">
                <summary className="cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300">
                  Permisos opcionales (sin funcionalidad en el CRM todavía)
                </summary>
                <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">{opcionales.map(renderFila)}</ul>
              </details>
            )}

            <p className="text-theme-xs text-gray-400">{salud.notaAdvancedAccess}</p>
          </div>
        )
      )}
    </div>
  );
}

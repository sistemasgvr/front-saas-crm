"use client";

import { useQuery } from "@tanstack/react-query";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import Select from "@/src/components/form/Select";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import {
  actualizarRolLineaAction,
  actualizarSettingsLlamadaAction,
  setPresenciaAction,
} from "./actions";
import { getCallSettings, getCapacidadCalling, getPresencia } from "./queries";
import { etiquetaRolLinea, type RolLineaWhatsapp } from "./types";
import type { WhatsappConexion } from "@/src/modules/settings/whatsapp/types";

const ROL_OPTS = [
  { value: "MENSAJES", label: "Solo mensajes" },
  { value: "LLAMADAS", label: "Llamadas" },
  { value: "AMBOS", label: "Mensajes + llamadas" },
];

interface CallingSettingsPanelProps {
  conexion: WhatsappConexion;
}

export default function CallingSettingsPanel({ conexion }: CallingSettingsPanelProps) {
  const rol = (conexion.rolLinea ?? "MENSAJES") as RolLineaWhatsapp;
  const callingRole = rol === "LLAMADAS" || rol === "AMBOS";

  const capacidadQuery = useQuery({
    queryKey: queryKeys.whatsappCallCapacidad,
    queryFn: getCapacidadCalling,
  });

  const settingsQuery = useQuery({
    queryKey: queryKeys.whatsappCallSettings,
    queryFn: () => getCallSettings(conexion.id),
    enabled: callingRole,
  });

  const presenciaQuery = useQuery({
    queryKey: queryKeys.whatsappCallPresencia,
    queryFn: getPresencia,
    enabled: callingRole,
  });

  const rolMutation = useAppMutation({
    mutationFn: (nuevo: RolLineaWhatsapp) => actualizarRolLineaAction(conexion.id, nuevo),
    successMessage: "Rol de línea actualizado",
    invalidateKeys: [
      queryKeys.whatsappConexiones,
      queryKeys.whatsappCallCapacidad,
      queryKeys.whatsappCallSettings,
    ],
  });

  const settingsMutation = useAppMutation({
    mutationFn: (status: string) =>
      actualizarSettingsLlamadaAction({ conexionId: conexion.id, status }),
    successMessage: "Ajustes de llamadas actualizados",
    invalidateKeys: [queryKeys.whatsappCallSettings, queryKeys.whatsappCallCapacidad],
  });

  const presenciaMutation = useAppMutation({
    mutationFn: (disponible: boolean) => setPresenciaAction(disponible),
    successMessage: "Presencia actualizada",
    invalidateKeys: [queryKeys.whatsappCallPresencia],
    silent: true,
  });

  const capacidad = capacidadQuery.data;
  const settings = settingsQuery.data;
  const statusMeta = settings?.settings?.status?.toUpperCase() ?? "—";

  return (
    <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          color={rol === "MENSAJES" ? "light" : rol === "AMBOS" ? "success" : "info"}
          size="sm"
        >
          {etiquetaRolLinea(rol)}
        </Badge>
        {conexion.callingHabilitado ? (
          <Badge color="success" size="sm">
            Calling ON
          </Badge>
        ) : callingRole ? (
          <Badge color="warning" size="sm">
            Calling OFF
          </Badge>
        ) : null}
        {capacidad && capacidad.conexionId === conexion.id ? (
          <Badge color={capacidad.disponible ? "success" : "warning"} size="sm">
            {capacidad.disponible ? "Saludable" : "Requiere atención"}
          </Badge>
        ) : null}
      </div>

      <div className="max-w-xs">
        <label className="mb-1.5 block text-theme-xs font-medium text-gray-500">
          Rol de la línea
        </label>
        <Select
          options={ROL_OPTS}
          value={rol}
          onChange={(v) => rolMutation.mutate(v as RolLineaWhatsapp)}
          disabled={rolMutation.isPending}
        />
      </div>

      {callingRole ? (
        <div className="space-y-3 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
          <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
            Ajustes de llamadas
          </p>
          <div className="flex flex-wrap gap-2 text-theme-xs text-gray-600 dark:text-gray-300">
            <span>Estado Meta: {statusMeta}</span>
            {settings?.settings?.call_icon_visibility ? (
              <span>· Icono: {settings.settings.call_icon_visibility}</span>
            ) : null}
            {settings?.settings?.callback_permission_status ? (
              <span>· Callback: {settings.settings.callback_permission_status}</span>
            ) : null}
          </div>
          {capacidad?.unhealthyReason ? (
            <p className="text-theme-xs text-warning-600 dark:text-warning-400">
              {capacidad.unhealthyReason}
            </p>
          ) : null}
          {conexion.callingUltimoError ? (
            <p className="text-theme-xs text-error-500">{conexion.callingUltimoError}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              loading={settingsMutation.isPending}
              onClick={() => settingsMutation.mutate("ENABLED")}
            >
              Habilitar calling
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={settingsMutation.isPending}
              onClick={() => settingsMutation.mutate("DISABLED")}
            >
              Deshabilitar
            </Button>
            <Button
              size="sm"
              variant={presenciaQuery.data?.disponible ? "primary" : "outline"}
              loading={presenciaMutation.isPending}
              startIcon={<Icon name="mdi:account-voice" size={16} />}
              onClick={() =>
                presenciaMutation.mutate(!(presenciaQuery.data?.disponible ?? false))
              }
            >
              {presenciaQuery.data?.disponible
                ? "Disponible para llamadas"
                : "No disponible"}
            </Button>
          </div>

          <p className="text-theme-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Requisitos ops: solo Cloud API, límite de mensajería ≥ 2000 conversaciones,
            método de pago activo para BIC, variables TURN/STUN en el servidor, y el
            campo de webhook <code className="text-gray-700 dark:text-gray-200">calls</code>{" "}
            suscrito en Meta.
          </p>
        </div>
      ) : null}
    </div>
  );
}

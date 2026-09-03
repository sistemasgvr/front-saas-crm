"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { pedirPermisoNotificacionesSistema, useNotificacionesSistemaPermiso } from "./system-notifications";

/**
 * Preferencia por dispositivo/navegador, no de la organización — por eso va
 * en Perfil, no en Configuración. Activa el aviso nativo del sistema
 * operativo (además del toast y el sonido, que ya funcionan siempre) para
 * mensajes de WhatsApp y notificaciones generales, mientras el CRM siga
 * abierto en algún lado (aunque esté minimizado o en otra pestaña).
 */
export default function NotificationPermissionCard() {
  const permiso = useNotificacionesSistemaPermiso();
  const [pidiendo, setPidiendo] = useState(false);

  async function activar() {
    setPidiendo(true);
    try {
      const resultado = await pedirPermisoNotificacionesSistema();
      if (resultado === "denied") {
        toast.error("Bloqueaste las notificaciones del sistema para este sitio en tu navegador");
      }
    } finally {
      setPidiendo(false);
    }
  }

  if (permiso === "no-soportado") return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <Icon name="mdi:bell-ring-outline" size={18} />
          </span>
          <div>
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Notificaciones del sistema</p>
            <p className="mt-1 max-w-md text-theme-xs text-gray-500 dark:text-gray-400">
              Avisos nativos para WhatsApp y notificaciones generales mientras el CRM siga abierto. Se
              solicitan al entrar; aquí puedes revisar el estado en este dispositivo.
            </p>
          </div>
        </div>

        {permiso === "granted" ? (
          <span className="flex shrink-0 items-center gap-1.5 text-theme-xs font-medium text-success-600 dark:text-success-500">
            <Icon name="mdi:check-circle" size={16} />
            Activadas
          </span>
        ) : permiso === "denied" ? (
          <span className="shrink-0 text-theme-xs text-gray-400">
            Bloqueadas — para activarlas, habilita notificaciones para este sitio desde los ajustes de tu navegador.
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={pidiendo}
            onClick={activar}
            startIcon={<Icon name="mdi:bell-plus-outline" size={18} />}
          >
            Activar
          </Button>
        )}
      </div>
    </div>
  );
}

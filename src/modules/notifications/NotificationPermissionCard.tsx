"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { getVapidPublicKey } from "./queries";
import { subscribePushAction } from "./actions";
import { pedirPermisoNotificacionesSistema, useNotificacionesSistemaPermiso } from "./system-notifications";
import { asegurarSuscripcionPush, soportaWebPush } from "./web-push";

/**
 * Preferencia por dispositivo — en Perfil. Activa permiso + suscripción Web Push.
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
        return;
      }
      if (resultado === "granted") {
        const push = await asegurarSuscripcionPush({
          getVapidPublicKey,
          saveSubscription: subscribePushAction,
        });
        if (push === "ok") {
          toast.success("Dispositivo listo para avisos en segundo plano");
        } else if (push === "sin-vapid") {
          toast.message("Permiso OK; el servidor aún no tiene claves VAPID configuradas");
        }
      }
    } finally {
      setPidiendo(false);
    }
  }

  if (permiso === "no-soportado") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <Icon name="mdi:cellphone" size={18} />
          </span>
          <div>
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Notificaciones en este dispositivo
            </p>
            <p className="mt-1 max-w-md text-theme-xs text-gray-500 dark:text-gray-400">
              En iPhone: Compartir → Agregar a pantalla de inicio, y abre el CRM desde el icono.
              En Android: usa Chrome y activa el permiso cuando se solicite.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <Icon name="mdi:bell-ring-outline" size={18} />
          </span>
          <div>
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Notificaciones del sistema
            </p>
            <p className="mt-1 max-w-md text-theme-xs text-gray-500 dark:text-gray-400">
              WhatsApp, leads y recordatorios de agenda
              {soportaWebPush()
                ? " — también con el CRM cerrado o en segundo plano."
                : " mientras la pestaña esté abierta."}
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
            Bloqueadas — habilítalas en los ajustes del navegador para este sitio.
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

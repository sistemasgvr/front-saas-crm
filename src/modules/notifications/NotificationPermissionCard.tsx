"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { getVapidPublicKey } from "./queries";
import { subscribePushAction, testPushAction } from "./actions";
import { pedirPermisoNotificacionesSistema, useNotificacionesSistemaPermiso } from "./system-notifications";
import { asegurarSuscripcionPush, debeRegistrarPushEnEsteOrigen, soportaWebPush } from "./web-push";

/**
 * Preferencia por dispositivo — en Perfil. Activa permiso + suscripción Web Push.
 */
export default function NotificationPermissionCard() {
  const permiso = useNotificacionesSistemaPermiso();
  const [pidiendo, setPidiendo] = useState(false);
  const [probando, setProbando] = useState(false);

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
        } else if (push === "omitido-localhost") {
          toast.message(
            "Permiso OK; push no se registra en localhost (usa producción o NEXT_PUBLIC_ENABLE_PUSH_ON_LOCALHOST)",
          );
        } else if (push === "sin-vapid") {
          toast.message("Permiso OK; el servidor aún no tiene claves VAPID configuradas");
        }
      }
    } finally {
      setPidiendo(false);
    }
  }

  async function probarPush() {
    setProbando(true);
    try {
      const res = await testPushAction();
      if (!res.enabled) {
        toast.error("Web Push deshabilitado: faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en el backend");
        return;
      }
      if (res.sent === 0) {
        toast.error(
          "No hay suscripciones push activas para tu usuario. Activa notificaciones en este dispositivo (origen de producción).",
        );
        return;
      }
      toast.success(
        `Push enviado a ${res.sent} dispositivo(s). Pon la app en segundo plano si no ves el aviso del SO.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el push de prueba");
    } finally {
      setProbando(false);
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
              {!debeRegistrarPushEnEsteOrigen()
                ? " En localhost no se registra Web Push (evita avisos que abren localhost)."
                : null}
            </p>
          </div>
        </div>

        {permiso === "granted" ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-theme-xs font-medium text-success-600 dark:text-success-500">
              <Icon name="mdi:check-circle" size={16} />
              Activadas
            </span>
            {soportaWebPush() ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={probando}
                onClick={probarPush}
                startIcon={<Icon name="mdi:cellphone-message" size={18} />}
              >
                Probar push
              </Button>
            ) : null}
          </div>
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

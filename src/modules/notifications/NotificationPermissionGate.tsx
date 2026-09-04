"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";
import { Icon } from "@/src/components/ui/Icon";
import { getVapidPublicKey } from "./queries";
import { subscribePushAction } from "./actions";
import {
  pedirPermisoNotificacionesSistema,
  soportaNotificacionesSistema,
  useNotificacionesSistemaPermiso,
} from "./system-notifications";
import { asegurarSuscripcionPush, soportaWebPush } from "./web-push";

const SESSION_ACK_KEY = "crm-notif-unsupported-ack";
const SESSION_LATER_KEY = "crm-notif-permission-later";

/**
 * Pre-prompt de notificaciones (best practice MDN):
 * - Explica el valor antes de llamar a requestPermission
 * - Solo pide permiso en gesto de usuario (click)
 * - Permite "Ahora no" sin quemar el prompt del navegador
 */
export default function NotificationPermissionGate() {
  const permiso = useNotificacionesSistemaPermiso();
  const soportado = soportaNotificacionesSistema();
  const [pidiendo, setPidiendo] = useState(false);
  const [sinSoporteAck, setSinSoporteAck] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(SESSION_ACK_KEY) === "1";
  });
  const [pospuesto, setPospuesto] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(SESSION_LATER_KEY) === "1";
  });

  const debeSolicitar = soportado && permiso === "default" && !pospuesto;
  const debeInformarSinSoporte = !soportado && !sinSoporteAck;

  if (!debeSolicitar && !debeInformarSinSoporte) return null;

  async function activar() {
    setPidiendo(true);
    try {
      const resultado = await pedirPermisoNotificacionesSistema();
      if (resultado === "denied") {
        toast.error(
          "Bloqueaste las notificaciones. Habilítalas en los ajustes de tu navegador para este sitio.",
        );
        return;
      }
      if (resultado === "granted") {
        const push = await asegurarSuscripcionPush({
          getVapidPublicKey,
          saveSubscription: subscribePushAction,
        });
        if (push === "ok") {
          toast.success("Notificaciones activadas (también en segundo plano)");
        } else if (push === "sin-vapid") {
          toast.success("Notificaciones activadas en esta pestaña");
        } else {
          toast.success("Notificaciones del sistema activadas");
        }
      }
    } finally {
      setPidiendo(false);
    }
  }

  function reconocerSinSoporte() {
    sessionStorage.setItem(SESSION_ACK_KEY, "1");
    setSinSoporteAck(true);
  }

  function ahoraNo() {
    sessionStorage.setItem(SESSION_LATER_KEY, "1");
    setPospuesto(true);
  }

  if (debeInformarSinSoporte) {
    return (
      <Modal open onClose={reconocerSinSoporte} showCloseButton={false}>
        <div className="p-6 pt-8 sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <Icon name="mdi:bell-off-outline" size={28} />
          </div>
          <h2 className="mt-5 text-center text-lg font-semibold text-gray-800 dark:text-white/90">
            Notificaciones no disponibles aquí
          </h2>
          <p className="mt-2 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            En iPhone, agrega el CRM a la pantalla de inicio (Compartir → Agregar a inicio) y ábrelo
            desde ahí para poder recibir avisos. En Android usa Chrome.
          </p>
          <p className="mt-3 text-center text-theme-xs text-gray-400 dark:text-gray-500">
            El sonido y los avisos dentro del CRM siguen funcionando con la pestaña abierta.
          </p>
          <div className="mt-6 flex justify-center">
            <Button type="button" size="sm" onClick={reconocerSinSoporte}>
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={ahoraNo} showCloseButton={false}>
      <div className="p-6 pt-8 sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
          <Icon name="mdi:bell-ring-outline" size={28} />
        </div>
        <h2 className="mt-5 text-center text-lg font-semibold text-gray-800 dark:text-white/90">
          Activa las notificaciones
        </h2>
        <p className="mt-2 text-center text-theme-sm text-gray-500 dark:text-gray-400">
          Recibe avisos de WhatsApp, leads nuevos y actividades de agenda cercanas — también en el
          teléfono cuando el CRM esté en segundo plano
          {soportaWebPush() ? "" : " (en este navegador solo mientras la pestaña esté abierta)"}.
        </p>
        <p className="mt-3 text-center text-theme-xs text-gray-400 dark:text-gray-500">
          Tu navegador te pedirá confirmación al pulsar Activar. Puedes hacerlo después desde Perfil.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={pidiendo}
            onClick={ahoraNo}
          >
            Ahora no
          </Button>
          <Button
            type="button"
            size="sm"
            loading={pidiendo}
            className="w-full sm:w-auto"
            startIcon={<Icon name="mdi:bell-plus-outline" size={18} />}
            onClick={activar}
          >
            Activar notificaciones
          </Button>
        </div>
      </div>
    </Modal>
  );
}

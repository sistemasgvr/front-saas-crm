"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";
import { Icon } from "@/src/components/ui/Icon";
import {
  pedirPermisoNotificacionesSistema,
  soportaNotificacionesSistema,
  useNotificacionesSistemaPermiso,
} from "./system-notifications";

const SESSION_ACK_KEY = "crm-notif-unsupported-ack";

/**
 * Solicita permiso de notificaciones del sistema al entrar al CRM.
 * Los navegadores exigen un gesto del usuario para abrir el diálogo nativo,
 * por eso mostramos un modal obligatorio hasta que el usuario responda.
 */
export default function NotificationPermissionGate() {
  const permiso = useNotificacionesSistemaPermiso();
  const soportado = soportaNotificacionesSistema();
  const [pidiendo, setPidiendo] = useState(false);
  const [sinSoporteAck, setSinSoporteAck] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(SESSION_ACK_KEY) === "1";
  });

  const debeSolicitar = soportado && permiso === "default";
  const debeInformarSinSoporte = !soportado && !sinSoporteAck;

  if (!debeSolicitar && !debeInformarSinSoporte) return null;

  async function activar() {
    setPidiendo(true);
    try {
      const resultado = await pedirPermisoNotificacionesSistema();
      if (resultado === "denied") {
        toast.error("Bloqueaste las notificaciones. Habilítalas en los ajustes de tu navegador para este sitio.");
      } else if (resultado === "granted") {
        toast.success("Notificaciones del sistema activadas");
      }
    } finally {
      setPidiendo(false);
    }
  }

  function reconocerSinSoporte() {
    sessionStorage.setItem(SESSION_ACK_KEY, "1");
    setSinSoporteAck(true);
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
            Este navegador o dispositivo no permite avisos nativos del sistema en la web. Prueba desde
            escritorio (Chrome, Edge o Firefox) o, en iPhone, agrega el CRM a la pantalla de inicio e
            ábrelo desde ahí.
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
    <Modal open onClose={() => {}} showCloseButton={false}>
      <div className="p-6 pt-8 sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
          <Icon name="mdi:bell-ring-outline" size={28} />
        </div>
        <h2 className="mt-5 text-center text-lg font-semibold text-gray-800 dark:text-white/90">
          Activa las notificaciones del sistema
        </h2>
        <p className="mt-2 text-center text-theme-sm text-gray-500 dark:text-gray-400">
          Para no perderte mensajes de WhatsApp ni avisos de leads nuevos, el CRM necesita permiso para
          mostrar alertas nativas — aunque estés en otra pestaña o la ventana esté minimizada.
        </p>
        <p className="mt-3 text-center text-theme-xs text-gray-400 dark:text-gray-500">
          Funciona en escritorio y móvil. Tu navegador te pedirá confirmación al pulsar el botón.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
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

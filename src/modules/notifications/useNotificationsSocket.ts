"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/src/lib/query/keys";
import { getSocketTicket, getVapidPublicKey } from "./queries";
import { subscribePushAction, unsubscribePushAction } from "./actions";
import { reproducirSonidoNotificacion } from "./notification-sounds";
import {
  marcarNotificacionVistaReciente,
  mostrarNotificacionSistema,
  notificacionYaVistaReciente,
  permisoNotificacionesSistema,
  useNotificacionesSistemaPermiso,
} from "./system-notifications";
import {
  asegurarSuscripcionPush,
  desactivarSuscripcionPushLocal,
  registrarServiceWorker,
} from "./web-push";
import { resolverRutaNotificacion, type NotificacionEventoSocket } from "./types";

function invalidarCachesNotificacion(
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
  void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappChatsUnreadCount });
}

function pintarNotificacionEnVivo(
  data: Pick<NotificacionEventoSocket, "id" | "tipo" | "titulo" | "mensaje" | "payload">,
  router: ReturnType<typeof useRouter>,
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  if (notificacionYaVistaReciente(data.id)) return;
  marcarNotificacionVistaReciente(data.id);

  toast.info(data.titulo, { description: data.mensaje });
  reproducirSonidoNotificacion(data.tipo);
  mostrarNotificacionSistema(data.titulo, {
    body: data.mensaje,
    tag: data.id,
    onClick: () => {
      const ruta = resolverRutaNotificacion(data.payload);
      if (ruta) router.push(ruta);
    },
  });
  invalidarCachesNotificacion(queryClient);
}

/**
 * Socket de notificaciones + registro de Service Worker / Web Push.
 * El ticket se pide en cada intento de conexión (vive 60s).
 */
export function useNotificationsSocket(enabled: boolean) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const permiso = useNotificacionesSistemaPermiso();
  const permisoAnterior = useRef(permiso);

  // Suscripción / baja según permiso (incl. cambios desde ajustes del SO).
  useEffect(() => {
    if (!enabled) return;

    void registrarServiceWorker();

    if (permiso === "granted") {
      void asegurarSuscripcionPush({
        getVapidPublicKey,
        saveSubscription: subscribePushAction,
      });
    } else if (permiso === "denied" && permisoAnterior.current === "granted") {
      void desactivarSuscripcionPushLocal({ removeOnServer: unsubscribePushAction });
    }

    permisoAnterior.current = permiso;
  }, [enabled, permiso]);

  useEffect(() => {
    if (!enabled) return;

    const onSwMessage = (event: MessageEvent) => {
      const msg = event.data as {
        type?: string;
        ruta?: string;
        data?: {
          id?: string;
          tipo?: string;
          titulo?: string;
          mensaje?: string;
          payload?: Record<string, unknown> | null;
        };
      } | null;

      if (msg?.type === "crm-notification-navigate" && typeof msg.ruta === "string") {
        router.push(msg.ruta);
        return;
      }

      // Fallback si el socket está caído pero llegó push con pestaña enfocada.
      if (msg?.type === "crm-push-foreground" && msg.data?.id) {
        pintarNotificacionEnVivo(
          {
            id: msg.data.id,
            tipo: msg.data.tipo ?? "INFO",
            titulo: msg.data.titulo ?? "CRM",
            mensaje: msg.data.mensaje ?? "",
            payload: msg.data.payload ?? null,
          },
          router,
          queryClient,
        );
      }
    };
    navigator.serviceWorker?.addEventListener("message", onSwMessage);

    const url = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!url) {
      return () => {
        navigator.serviceWorker?.removeEventListener("message", onSwMessage);
      };
    }

    let socket: Socket | null = io(`${url}/notifications`, {
      auth: (cb) => {
        getSocketTicket()
          .then(({ ticket }) => cb({ ticket }))
          .catch(() => cb({}));
      },
    });

    socket.on("notificacion:nueva", (data: NotificacionEventoSocket) => {
      pintarNotificacionEnVivo(data, router, queryClient);
    });

    return () => {
      socket?.disconnect();
      socket = null;
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [enabled, queryClient, router]);
}

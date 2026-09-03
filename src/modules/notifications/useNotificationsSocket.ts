"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/src/lib/query/keys";
import { getSocketTicket, getVapidPublicKey } from "./queries";
import { subscribePushAction } from "./actions";
import { reproducirSonidoNotificacion } from "./notification-sounds";
import { mostrarNotificacionSistema, permisoNotificacionesSistema } from "./system-notifications";
import { asegurarSuscripcionPush, registrarServiceWorker } from "./web-push";
import { resolverRutaNotificacion, type NotificacionEventoSocket } from "./types";

/**
 * Socket de notificaciones + registro de Service Worker / Web Push.
 * El ticket se pide en cada intento de conexión (vive 60s).
 */
export function useNotificationsSocket(enabled: boolean) {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    void registrarServiceWorker();

    if (permisoNotificacionesSistema() === "granted") {
      void asegurarSuscripcionPush({
        getVapidPublicKey,
        saveSubscription: subscribePushAction,
      });
    }

    const onSwMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; ruta?: string } | null;
      if (data?.type === "crm-notification-navigate" && typeof data.ruta === "string") {
        router.push(data.ruta);
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappChatsUnreadCount });
    });

    return () => {
      socket?.disconnect();
      socket = null;
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [enabled, queryClient, router]);
}

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/src/lib/query/keys";
import type { ConversacionResumen } from "@/src/modules/chats/types";
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

/** Sube el chat al tope, suma no leídos y refresca preview sin esperar el GET.
 * @returns true si el chat ya estaba en la lista y se pudo parchear. */
function parchearListaChatsWhatsapp(
  queryClient: ReturnType<typeof useQueryClient>,
  conversacionId: string,
  preview: string | null,
): boolean {
  const enChatActivo =
    typeof window !== "undefined" &&
    (window.location.pathname === `/chats/${conversacionId}` ||
      window.location.pathname.startsWith(`/chats/${conversacionId}/`));

  let sumoNoLeido = false;
  let parcheado = false;

  queryClient.setQueryData<ConversacionResumen[]>(queryKeys.whatsappChats, (prev) => {
    if (!Array.isArray(prev) || prev.length === 0) return prev;
    const idx = prev.findIndex((c) => c.id === conversacionId);
    if (idx < 0) return prev;

    parcheado = true;
    const actual = prev[idx];
    const noLeidos = enChatActivo ? 0 : (actual.noLeidos ?? 0) + 1;
    if (!enChatActivo) sumoNoLeido = true;

    const actualizado: ConversacionResumen = {
      ...actual,
      ultimoMensajeEn: new Date().toISOString(),
      ultimoMensajeTexto: preview?.trim() || actual.ultimoMensajeTexto,
      noLeidos,
    };
    return [actualizado, ...prev.filter((c) => c.id !== conversacionId)];
  });

  if (sumoNoLeido) {
    queryClient.setQueryData<{ count: number }>(queryKeys.whatsappChatsUnreadCount, (prev) => ({
      count: (prev?.count ?? 0) + 1,
    }));
  }

  return parcheado;
}

function invalidarCachesNotificacion(
  queryClient: ReturnType<typeof useQueryClient>,
  payload?: Record<string, unknown> | null,
  tipo?: string,
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });

  const conversacionId =
    typeof payload?.whatsappConversacionId === "string"
      ? payload.whatsappConversacionId
      : null;
  const esWhatsapp = Boolean(conversacionId) || tipo === "WHATSAPP_MENSAJE";

  if (!esWhatsapp) return;

  const preview =
    typeof payload?.ultimoMensajeTexto === "string" ? payload.ultimoMensajeTexto : null;

  let listaParcheada = false;
  if (conversacionId) {
    listaParcheada = parchearListaChatsWhatsapp(queryClient, conversacionId, preview);
  }

  if (conversacionId && !listaParcheada) {
    void queryClient.refetchQueries({
      queryKey: queryKeys.whatsappChats,
      type: "active",
    });
  }

  // Forzar descarga del hilo YA (invalidate + staleTime 30s a veces no alcanza).
  if (conversacionId) {
    void queryClient.refetchQueries({
      queryKey: queryKeys.whatsappChat(conversacionId),
    });
  }
}

function pintarNotificacionEnVivo(
  data: Pick<NotificacionEventoSocket, "id" | "tipo" | "titulo" | "mensaje" | "payload">,
  router: ReturnType<typeof useRouter>,
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  const yaVista = notificacionYaVistaReciente(data.id);
  if (!yaVista) {
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
  }

  // Siempre refrescar chats aunque push + socket disparen el mismo id
  // (antes el 2.º evento salía antes y el mensaje no cargaba).
  invalidarCachesNotificacion(queryClient, data.payload, data.tipo);
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
        removeOnServer: unsubscribePushAction,
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

      if (msg?.type === "crm-pushsubscriptionchange") {
        void asegurarSuscripcionPush({
          getVapidPublicKey,
          saveSubscription: subscribePushAction,
          removeOnServer: unsubscribePushAction,
          forceResubscribe: true,
        });
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

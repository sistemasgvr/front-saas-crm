"use client";

import { updateChatList, type ChatListCache } from "@/src/modules/chats/chat-list-cache";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/src/lib/query/keys";
import type { ConversacionResumen } from "@/src/modules/chats/types";
import { markWhatsappNotificationsReadAction, subscribePushAction, unsubscribePushAction } from "./actions";
import { getSocketTicket, getVapidPublicKey } from "./queries";
import { reproducirSonidoNotificacion } from "./notification-sounds";
import {
  cuerpoNotificacionWhatsapp,
  dismissWhatsappOsNotification,
  marcarNotificacionVistaReciente,
  mostrarNotificacionSistema,
  notificacionYaVistaReciente,
  tagNotificacionWhatsapp,
  useNotificacionesSistemaPermiso,
} from "./system-notifications";
import {
  asegurarSuscripcionPush,
  desactivarSuscripcionPushLocal,
  registrarServiceWorker,
} from "./web-push";
import { resolverRutaNotificacion, type NotificacionEventoSocket } from "./types";
import { iniciarRingLlamada, detenerRingLlamada } from "@/src/modules/calls/call-sounds";
import { useCallStore } from "@/src/modules/calls/call-store";
import { useTiempoRealStore } from "@/src/stores/tiempo-real.store";
import type {
  LlamadaEndedSocket,
  LlamadaIncomingSocket,
} from "@/src/modules/calls/types";

/** Evento del backend (TiempoRealChatsService): un chat cambió. Sin
 * contenido — se vuelve a pedir por los endpoints que filtran permisos. */
interface CambioChatSocket {
  conversacionId?: unknown;
  cambios?: unknown;
}

/** Cambios que mueven el chat en la lista (orden, preview, no leídos). */
const CAMBIOS_QUE_AFECTAN_LISTA = new Set(["mensaje", "eco", "saliente", "edicion"]);

/** Agrupa avisos que llegan casi juntos (mensaje + estado + archivo) en un
 * solo refetch por chat. */
const ESPERA_AGRUPAR_CAMBIOS_MS = 100;

/** Pestaña oculta al menos este tiempo → al volver se pone al día. */
const OCULTA_PARA_REFRESCAR_MS = 15_000;

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

  queryClient.setQueriesData<ChatListCache>(
    { queryKey: ["whatsapp", "chats", "list"] },
    (cache) => updateChatList(cache, (prev) => {
    if (prev.length === 0) return prev;
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
  }),
  );

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

  // Avisos de cuenta del webhook (coexistencia, plantillas, nombre…): la
  // tarjeta de la línea y las plantillas muestran el estado nuevo al instante.
  if (tipo === "WHATSAPP_CUENTA") {
    void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappConexiones });
    void queryClient.invalidateQueries({ queryKey: ["whatsapp", "connection-health"] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappTemplates });
  }

  if (!esWhatsapp) return;

  const preview =
    typeof payload?.ultimoMensajeTexto === "string" ? payload.ultimoMensajeTexto : null;

  if (conversacionId) {
    parchearListaChatsWhatsapp(queryClient, conversacionId, preview);
  }

  // Con socket vivo, el evento "whatsapp:chat" ya trae el refetch del hilo y
  // la lista (evita pedir lo mismo dos o tres veces). Sin socket (aviso que
  // llegó por Web Push) se fuerza aquí.
  if (conversacionId && !useTiempoRealStore.getState().conectado) {
    void queryClient.refetchQueries({
      queryKey: queryKeys.whatsappChats,
      type: "active",
    });
  }
}

function pintarNotificacionEnVivo(
  data: Pick<NotificacionEventoSocket, "id" | "tipo" | "titulo" | "mensaje" | "payload">,
  router: ReturnType<typeof useRouter>,
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  const conversacionId =
    typeof data.payload?.whatsappConversacionId === "string"
      ? data.payload.whatsappConversacionId
      : null;
  const enChatActivo =
    Boolean(conversacionId) &&
    typeof window !== "undefined" &&
    (window.location.pathname === `/chats/${conversacionId}` ||
      window.location.pathname.startsWith(`/chats/${conversacionId}/`));

  // Ya estás viendo ese chat: no toast/SO; marcar leída + quitar aviso agrupado.
  if (enChatActivo && conversacionId) {
    dismissWhatsappOsNotification(conversacionId);
    void markWhatsappNotificationsReadAction(conversacionId)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.notificationsUnreadCount,
        });
      })
      .catch(() => undefined);
    invalidarCachesNotificacion(queryClient, data.payload, data.tipo);
    return;
  }

  const yaVista = notificacionYaVistaReciente(data.id);
  const ruta = resolverRutaNotificacion(data.payload, data.tipo);
  if (!yaVista) {
    marcarNotificacionVistaReciente(data.id);
    toast.info(data.titulo, {
      description: data.mensaje,
      ...(ruta
        ? {
            action: {
              label: "Ver",
              onClick: () => router.push(ruta),
            },
          }
        : {}),
    });
    reproducirSonidoNotificacion(data.tipo);
    const noLeidos =
      typeof data.payload?.noLeidos === "number" ? data.payload.noLeidos : undefined;
    const esWhatsapp = data.tipo === "WHATSAPP_MENSAJE" || Boolean(conversacionId);
    mostrarNotificacionSistema(data.titulo, {
      body: esWhatsapp
        ? cuerpoNotificacionWhatsapp(data.mensaje, noLeidos)
        : data.mensaje,
      tag:
        esWhatsapp && conversacionId
          ? tagNotificacionWhatsapp(conversacionId)
          : data.id,
      onClick: () => {
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

    const setConectado = useTiempoRealStore.getState().setConectado;

    let socket: Socket | null = io(`${url}/notifications`, {
      auth: (cb) => {
        getSocketTicket()
          .then(({ ticket }) => cb({ ticket }))
          .catch(() => cb({}));
      },
      // WebSocket directo (sin el paso previo por long-polling): conecta más
      // rápido y no deja requests HTTP colgando en el backend. Si un proxy no
      // admite WebSocket, cae a polling.
      transports: ["websocket", "polling"],
      tryAllTransports: true,
    });

    /** Ponerse al día con lo que pudo pasar sin socket (reconexión, pestaña
     * dormida): chats activos y notificaciones. */
    const ponerseAlDia = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappChats });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
    };

    socket.on("connect", () => {
      setConectado(true);
      ponerseAlDia();
    });
    socket.on("disconnect", () => setConectado(false));

    // Cambios de chats en vivo, agrupados por chat en una ventana corta.
    const cambiosPendientes = new Map<string, Set<string>>();
    let timerCambios: ReturnType<typeof setTimeout> | null = null;
    const aplicarCambiosChats = () => {
      timerCambios = null;
      let refrescarLista = false;
      for (const [conversacionId, cambios] of cambiosPendientes) {
        // cancelRefetch:false → si ya hay un GET en curso no se duplica.
        void queryClient.invalidateQueries(
          { queryKey: queryKeys.whatsappChat(conversacionId), exact: true },
          { cancelRefetch: false },
        );
        if ([...cambios].some((c) => CAMBIOS_QUE_AFECTAN_LISTA.has(c))) {
          refrescarLista = true;
        }
      }
      cambiosPendientes.clear();
      if (refrescarLista) {
        void queryClient.invalidateQueries(
          { queryKey: ["whatsapp", "chats", "list"] },
          { cancelRefetch: false },
        );
        void queryClient.invalidateQueries(
          { queryKey: queryKeys.whatsappChatsUnreadCount },
          { cancelRefetch: false },
        );
      }
    };
    socket.on("whatsapp:chat", (data: CambioChatSocket) => {
      if (typeof data?.conversacionId !== "string" || !Array.isArray(data.cambios)) return;
      const cambios = cambiosPendientes.get(data.conversacionId) ?? new Set<string>();
      for (const cambio of data.cambios) {
        if (typeof cambio === "string") cambios.add(cambio);
      }
      cambiosPendientes.set(data.conversacionId, cambios);
      timerCambios ??= setTimeout(aplicarCambiosChats, ESPERA_AGRUPAR_CAMBIOS_MS);
    });

    // Navegadores congelan pestañas en segundo plano: al volver, reconectar
    // si hace falta y traer lo pendiente.
    let ocultaDesde: number | null = null;
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "hidden") {
        ocultaDesde = Date.now();
        return;
      }
      const estuvoOculta = ocultaDesde !== null && Date.now() - ocultaDesde >= OCULTA_PARA_REFRESCAR_MS;
      ocultaDesde = null;
      if (socket && !socket.connected) {
        socket.connect();
        return; // "connect" ya se pone al día.
      }
      if (estuvoOculta) ponerseAlDia();
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    socket.on('whatsapp:control', (data: { conversacionId?: string; controlVersion?: number }) => {
      if (typeof data?.conversacionId !== 'string') return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappChat(data.conversacionId) });
      void queryClient.invalidateQueries({ queryKey: ['whatsapp', 'chats', 'list'] });
    });
    socket.on("notificacion:nueva", (data: NotificacionEventoSocket) => {
      pintarNotificacionEnVivo(data, router, queryClient);
    });

    socket.on("notificacion:leida", () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
    });

    socket.on("notificacion:todas-leidas", () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
    });

    socket.on("call:incoming", (data: LlamadaIncomingSocket) => {
      useCallStore.getState().setIncoming(data);
      iniciarRingLlamada();
      toast.info("Llamada entrante de WhatsApp", {
        description: data.nombreContacto || data.waId || "Contacto",
      });
    });

    socket.on("call:ended", (data: LlamadaEndedSocket) => {
      detenerRingLlamada();
      useCallStore.getState().onRemoteEnded(data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappCalls });
    });

    return () => {
      detenerRingLlamada();
      if (timerCambios) clearTimeout(timerCambios);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      socket?.disconnect();
      socket = null;
      setConectado(false);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [enabled, queryClient, router]);
}

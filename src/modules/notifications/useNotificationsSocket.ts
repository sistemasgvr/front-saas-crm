"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/src/lib/query/keys";
import { getSocketTicket } from "./queries";
import type { NotificacionEventoSocket } from "./types";

/**
 * Un ticket nuevo se pide en cada intento de conexión (incluidas las
 * reconexiones) porque el ticket vive solo 60s — el callback `auth` de
 * socket.io-client se re-ejecuta automáticamente en cada intento.
 */
export function useNotificationsSocket(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!url) return;

    let socket: Socket | null = io(`${url}/notifications`, {
      auth: (cb) => {
        getSocketTicket()
          .then(({ ticket }) => cb({ ticket }))
          .catch(() => cb({}));
      },
    });

    socket.on("notificacion:nueva", (data: NotificacionEventoSocket) => {
      toast.info(data.titulo, { description: data.mensaje });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnreadCount });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [enabled, queryClient]);
}

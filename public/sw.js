/* global self, clients, registration */
/**
 * Service Worker del CRM — Web Push + click en notificación.
 * Asset version: 20260910gvr3 (bump: agrupar WhatsApp por chat + dismiss).
 * Si hay una ventana del CRM enfocada, no muestra el toast del SO (el socket
 * ya cubre toast/sonido; si el socket falla, postMessage crm-push-foreground);
 * si está en segundo plano o cerrada, sí muestra.
 */

const ICON_URL = "/icon.png?v=20260910gvr";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function rutaSegura(url) {
  return (
    typeof url === "string" &&
    url.startsWith("/") &&
    !url.startsWith("//")
  );
}

function resolverRuta(payload, tipo) {
  if (payload && typeof payload === "object" && typeof payload.whatsappConversacionId === "string") {
    return `/chats/${payload.whatsappConversacionId}`;
  }
  if (tipo === "WHATSAPP_MENSAJE") return "/chats";

  if (
    tipo === "AGENDA_PROXIMA" ||
    tipo === "AGENDA_ASIGNADA" ||
    (payload &&
      typeof payload === "object" &&
      (payload.origen === "VISITA" ||
        payload.origen === "ACTIVIDAD" ||
        payload.visitaId ||
        payload.actividadId))
  ) {
    if (payload && rutaSegura(payload.url) && String(payload.url).startsWith("/agenda")) {
      return payload.url;
    }
    if (payload && typeof payload.visitaId === "string") {
      return `/agenda?visitaId=${payload.visitaId}`;
    }
    if (payload && typeof payload.actividadId === "string") {
      return `/agenda?actividadId=${payload.actividadId}`;
    }
    return "/agenda";
  }

  if (!payload || typeof payload !== "object") return "/notifications";
  if (typeof payload.leadId === "string") return `/leads/${payload.leadId}`;
  if (typeof payload.metaPaginaId === "string") {
    return `/settings/meta/pages/${payload.metaPaginaId}`;
  }
  if (rutaSegura(payload.url)) return payload.url;
  return "/notifications";
}

function urlAbsoluta(ruta) {
  try {
    return new URL(ruta, self.location.origin).href;
  } catch {
    return self.location.origin + (ruta.startsWith("/") ? ruta : `/${ruta}`);
  }
}

function tagWhatsapp(conversacionId) {
  return `wa-${conversacionId}`;
}

function cuerpoWhatsapp(mensaje, payload) {
  const preview = mensaje || "";
  const n =
    payload && typeof payload === "object" && typeof payload.noLeidos === "number"
      ? payload.noLeidos
      : 0;
  if (n > 1) return `${n} mensajes · ${preview}`;
  return preview;
}

function cerrarPorTag(tag) {
  return self.registration.getNotifications({ tag }).then((list) => {
    for (const n of list) n.close();
  });
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { titulo: "CRM", mensaje: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const enfocada = windowClients.some((c) => c.focused);
      if (enfocada) {
        for (const client of windowClients) {
          client.postMessage({ type: "crm-push-foreground", data });
        }
        return;
      }

      const payload =
        data.payload && typeof data.payload === "object" ? data.payload : null;
      const conversacionId =
        payload && typeof payload.whatsappConversacionId === "string"
          ? payload.whatsappConversacionId
          : null;
      const esWhatsapp =
        data.tipo === "WHATSAPP_MENSAJE" || Boolean(conversacionId);

      const titulo = data.titulo || "CRM";
      const tag =
        esWhatsapp && conversacionId
          ? tagWhatsapp(conversacionId)
          : data.id || `crm-${Date.now()}`;
      const body = esWhatsapp
        ? cuerpoWhatsapp(data.mensaje, payload)
        : data.mensaje || "";

      await self.registration.showNotification(titulo, {
        body,
        tag,
        renotify: true,
        icon: ICON_URL,
        badge: ICON_URL,
        data: {
          ruta: resolverRuta(payload, data.tipo),
          notificacionId: data.id,
          tipo: data.tipo,
          conversacionId: conversacionId || undefined,
          payload,
        },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const ruta =
    (event.notification.data && event.notification.data.ruta) || "/notifications";
  const destino = urlAbsoluta(ruta);

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          client.postMessage({ type: "crm-notification-navigate", ruta });
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(destino);
      }
    })(),
  );
});

/** App → SW: cerrar toasts del SO al leer un chat / notificación. */
self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "crm-dismiss-whatsapp" && typeof msg.conversacionId === "string") {
    event.waitUntil(cerrarPorTag(tagWhatsapp(msg.conversacionId)));
    return;
  }

  if (msg.type === "crm-dismiss-notification" && typeof msg.tag === "string") {
    event.waitUntil(cerrarPorTag(msg.tag));
  }
});

/** El navegador rotó el endpoint: pedir a la app abierta que re-suscriba con JWT. */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windowClients) {
        client.postMessage({ type: "crm-pushsubscriptionchange" });
      }
    })(),
  );
});

/** Reserva: métricas / cleanup futuro al descartar el aviso del SO. */
self.addEventListener("notificationclose", () => {
  // no-op
});

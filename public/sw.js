/* global self, clients, registration */
/**
 * Service Worker del CRM — Web Push + click en notificación.
 * Si hay una ventana del CRM enfocada, no muestra el toast del SO (el socket
 * ya cubre toast/sonido); si está en segundo plano o cerrada, sí muestra.
 */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function resolverRuta(payload) {
  if (!payload || typeof payload !== "object") return "/notifications";
  if (typeof payload.whatsappConversacionId === "string") {
    return `/chats/${payload.whatsappConversacionId}`;
  }
  if (
    payload.origen === "VISITA" ||
    payload.origen === "ACTIVIDAD" ||
    payload.visitaId ||
    payload.actividadId
  ) {
    return "/agenda";
  }
  if (typeof payload.leadId === "string") return `/leads/${payload.leadId}`;
  if (typeof payload.metaPaginaId === "string") {
    return `/settings/meta/pages/${payload.metaPaginaId}`;
  }
  return "/notifications";
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

      const titulo = data.titulo || "CRM";
      await self.registration.showNotification(titulo, {
        body: data.mensaje || "",
        tag: data.id || undefined,
        icon: "/icon.png",
        badge: "/icon.png",
        data: {
          ruta: resolverRuta(data.payload),
          notificacionId: data.id,
          tipo: data.tipo,
        },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const ruta =
    (event.notification.data && event.notification.data.ruta) || "/notifications";

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
        await self.clients.openWindow(ruta);
      }
    })(),
  );
});

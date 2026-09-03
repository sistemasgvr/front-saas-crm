"use client";

import { useSyncExternalStore } from "react";

export function soportaNotificacionesSistema(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** "no-soportado" si el navegador no tiene la Notification API (ej. Safari
 * iOS en PWA no instalada) — distinto de "denied", que sí la tiene pero el
 * usuario la rechazó explícitamente. */
export function permisoNotificacionesSistema(): NotificationPermission | "no-soportado" {
  if (!soportaNotificacionesSistema()) return "no-soportado";
  return Notification.permission;
}

// Mismo patrón que ThemeContext: un store externo minimalista + useSyncExternalStore,
// para leer un valor solo-de-navegador (Notification.permission) sin el
// setState-dentro-de-effect que rompe la primera pintada SSR/cliente.
const listeners = new Set<() => void>();
function emitirCambio() {
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function snapshotServidor(): NotificationPermission | "no-soportado" {
  return "no-soportado";
}

/** Permiso actual de notificaciones del sistema — se recalcula solo cuando
 * `pedirPermisoNotificacionesSistema()` resuelve (no hay evento nativo de
 * cambio de permiso mientras la pestaña sigue abierta). */
export function useNotificacionesSistemaPermiso(): NotificationPermission | "no-soportado" {
  return useSyncExternalStore(subscribe, permisoNotificacionesSistema, snapshotServidor);
}

export async function pedirPermisoNotificacionesSistema(): Promise<NotificationPermission> {
  if (!soportaNotificacionesSistema()) return "denied";
  // Algunos navegadores antiguos usan callback; los modernos devuelven Promise.
  const resultado =
    typeof Notification.requestPermission === "function"
      ? await Notification.requestPermission()
      : "denied";
  emitirCambio();
  return resultado;
}

/**
 * Notificación nativa del sistema operativo (globo/toast del SO, no del
 * navegador) — funciona mientras la pestaña del CRM siga abierta en algún
 * lado (minimizada, en otra pestaña, en otra ventana o monitor), sin
 * necesidad de que esté al frente. No llega con el navegador completamente
 * cerrado — eso requiere Web Push (Service Worker + suscripción), que es
 * una pieza aparte, más grande, y no lo que se pidió acá.
 */
export function mostrarNotificacionSistema(
  titulo: string,
  opciones: { body?: string; tag?: string; onClick?: () => void } = {},
): void {
  if (permisoNotificacionesSistema() !== "granted") return;
  try {
    const notif = new Notification(titulo, {
      body: opciones.body,
      tag: opciones.tag,
      icon: "/icon.png",
    });
    if (opciones.onClick) {
      const onClick = opciones.onClick;
      notif.onclick = () => {
        window.focus();
        onClick();
        notif.close();
      };
    }
  } catch {
    // Algunos navegadores tiran si Notification() se llama en un contexto
    // sin foco reciente — nunca debe romper el resto del flujo.
  }
}

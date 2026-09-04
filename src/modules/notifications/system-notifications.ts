"use client";

import { useSyncExternalStore } from "react";
import { soportaWebPush } from "./web-push";

export function soportaNotificacionesSistema(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** "no-soportado" si el navegador no tiene la Notification API (ej. Safari
 * iOS sin PWA instalada) — distinto de "denied", que sí la tiene pero el
 * usuario la rechazó explícitamente. */
export function permisoNotificacionesSistema(): NotificationPermission | "no-soportado" {
  if (!soportaNotificacionesSistema()) return "no-soportado";
  return Notification.permission;
}

const listeners = new Set<() => void>();
let permissionWatchStarted = false;

function emitirCambio() {
  listeners.forEach((listener) => listener());
}

/** Escucha cambios de permiso hechos fuera de la app (ajustes del SO/navegador). */
function asegurarWatchPermiso(): void {
  if (permissionWatchStarted || typeof window === "undefined") return;
  permissionWatchStarted = true;

  if (!("permissions" in navigator) || typeof navigator.permissions?.query !== "function") {
    return;
  }

  void navigator.permissions
    .query({ name: "notifications" as PermissionName })
    .then((status) => {
      status.addEventListener("change", () => {
        emitirCambio();
      });
    })
    .catch(() => {
      // Safari / algunos embeds no soportan permissions.query(notifications)
    });
}

function subscribe(listener: () => void): () => void {
  asegurarWatchPermiso();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshotServidor(): NotificationPermission | "no-soportado" {
  return "no-soportado";
}

/** Permiso actual — se actualiza tras requestPermission o permissionchange. */
export function useNotificacionesSistemaPermiso(): NotificationPermission | "no-soportado" {
  return useSyncExternalStore(subscribe, permisoNotificacionesSistema, snapshotServidor);
}

export async function pedirPermisoNotificacionesSistema(): Promise<NotificationPermission> {
  if (!soportaNotificacionesSistema()) return "denied";
  asegurarWatchPermiso();
  const resultado =
    typeof Notification.requestPermission === "function"
      ? await Notification.requestPermission()
      : "denied";
  emitirCambio();
  return resultado;
}

/**
 * Aviso nativo del SO desde la pestaña abierta.
 * Con Web Push activo preferimos el Service Worker (funciona en segundo plano
 * y en móvil); aquí solo mostramos si la pestaña está oculta y no hay push.
 */
export function mostrarNotificacionSistema(
  titulo: string,
  opciones: { body?: string; tag?: string; onClick?: () => void } = {},
): void {
  if (permisoNotificacionesSistema() !== "granted") return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") return;
  // Si hay SW con push, el evento push del worker muestra el aviso del SO.
  if (soportaWebPush() && typeof navigator !== "undefined" && navigator.serviceWorker?.controller) {
    return;
  }
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
    // Algunos navegadores tiran si Notification() se llama sin gesto reciente.
  }
}

/** Evita toast duplicado socket + push-foreground (~2s). */
const recentNotifIds = new Map<string, number>();
const DEDUPE_MS = 2_000;

export function marcarNotificacionVistaReciente(id: string): void {
  const ahora = Date.now();
  recentNotifIds.set(id, ahora);
  for (const [key, ts] of recentNotifIds) {
    if (ahora - ts > DEDUPE_MS) recentNotifIds.delete(key);
  }
}

export function notificacionYaVistaReciente(id: string): boolean {
  const ts = recentNotifIds.get(id);
  if (!ts) return false;
  if (Date.now() - ts > DEDUPE_MS) {
    recentNotifIds.delete(id);
    return false;
  }
  return true;
}

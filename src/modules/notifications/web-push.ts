"use client";

/**
 * Helpers de Web Push + Service Worker.
 * Requiere VAPID configurado en el backend y HTTPS (o localhost con flag).
 *
 * Env front relevantes:
 * - NEXT_PUBLIC_SOCKET_URL — Socket.IO (toasts en vivo)
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY — fallback; debe = VAPID_PUBLIC_KEY del back
 * - NEXT_PUBLIC_ENABLE_PUSH_ON_LOCALHOST — "true" para suscribir en localhost
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function applicationServerKeyCoincide(
  sub: PushSubscription,
  vapidPublicKey: string,
): boolean {
  const key = sub.options?.applicationServerKey;
  if (!key) return false;
  const expected = urlBase64ToUint8Array(vapidPublicKey);
  const actual = new Uint8Array(key);
  if (actual.length !== expected.length) return false;
  for (let i = 0; i < actual.length; i += 1) {
    if (actual[i] !== expected[i]) return false;
  }
  return true;
}

export function soportaServiceWorker(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

export function soportaWebPush(): boolean {
  return (
    soportaServiceWorker() &&
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

/** Evita registrar push en localhost (clicks a localhost + contaminar BD prod). */
export function debeRegistrarPushEnEsteOrigen(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return process.env.NEXT_PUBLIC_ENABLE_PUSH_ON_LOCALHOST === "true";
  }
  return true;
}

export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!soportaServiceWorker()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export type ResultadoSuscripcionPush =
  | "ok"
  | "no-soportado"
  | "sin-vapid"
  | "sin-permiso"
  | "omitido-localhost"
  | "error";

export async function asegurarSuscripcionPush(opts: {
  getVapidPublicKey: () => Promise<{ enabled: boolean; publicKey: string | null }>;
  saveSubscription: (sub: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  }) => Promise<void>;
  /** Baja el endpoint viejo en el servidor (JWT) al rotar suscripción. */
  removeOnServer?: (endpoint: string) => Promise<void>;
  /** Tras pushsubscriptionchange: baja la sub actual y vuelve a suscribir. */
  forceResubscribe?: boolean;
}): Promise<ResultadoSuscripcionPush> {
  if (!soportaWebPush()) return "no-soportado";
  if (!debeRegistrarPushEnEsteOrigen()) return "omitido-localhost";
  if (Notification.permission !== "granted") return "sin-permiso";

  const vapid = await opts.getVapidPublicKey();
  if (!vapid.enabled || !vapid.publicKey) return "sin-vapid";

  const reg = await registrarServiceWorker();
  if (!reg) return "error";

  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  const keyMismatch = Boolean(sub && !applicationServerKeyCoincide(sub, vapid.publicKey));
  const debeRenovar = Boolean(opts.forceResubscribe || keyMismatch);

  if (debeRenovar && sub) {
    const oldEndpoint = sub.endpoint;
    try {
      await sub.unsubscribe();
    } catch {
      // continuar a re-suscribir
    }
    if (opts.removeOnServer && oldEndpoint) {
      try {
        await opts.removeOnServer(oldEndpoint);
      } catch {
        // no bloquear re-suscripción
      }
    }
    sub = null;
  }

  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey) as BufferSource,
      });
    } catch {
      return "error";
    }
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "error";

  try {
    await opts.saveSubscription({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
    return "ok";
  } catch {
    return "error";
  }
}

/**
 * Quita la suscripción Push de este navegador (local + servidor).
 * Best-effort: no lanza; pensado para logout y permiso denied.
 */
export async function desactivarSuscripcionPushLocal(opts?: {
  removeOnServer?: (endpoint: string) => Promise<void>;
}): Promise<void> {
  if (!soportaWebPush()) return;

  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;

    const endpoint = sub.endpoint;
    try {
      await sub.unsubscribe();
    } catch {
      // endpoint puede seguir válido en servidor
    }

    if (opts?.removeOnServer && endpoint) {
      try {
        await opts.removeOnServer(endpoint);
      } catch {
        // no bloquear logout / cambio de permiso
      }
    }
  } catch {
    // ignore
  }
}

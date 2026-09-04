"use client";

/**
 * Helpers de Web Push + Service Worker.
 * Requiere VAPID configurado en el backend y HTTPS (o localhost).
 *
 * Env front relevantes:
 * - NEXT_PUBLIC_SOCKET_URL — Socket.IO (toasts en vivo)
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY — fallback si GET /push/vapid-public-key falla
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
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

export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!soportaServiceWorker()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function asegurarSuscripcionPush(opts: {
  getVapidPublicKey: () => Promise<{ enabled: boolean; publicKey: string | null }>;
  saveSubscription: (sub: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
  }) => Promise<void>;
}): Promise<"ok" | "no-soportado" | "sin-vapid" | "sin-permiso" | "error"> {
  if (!soportaWebPush()) return "no-soportado";
  if (Notification.permission !== "granted") return "sin-permiso";

  const vapid = await opts.getVapidPublicKey();
  if (!vapid.enabled || !vapid.publicKey) return "sin-vapid";

  const reg = await registrarServiceWorker();
  if (!reg) return "error";

  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
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

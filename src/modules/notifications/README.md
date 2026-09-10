# Notificaciones (in-app + Socket + Web Push)

## Capas

1. **In-app** — campana, lista `/notifications`, leídas (`GET` unread / lista = fuente de verdad al reabrir).
2. **Socket.IO** — toast + sonido con la pestaña abierta (`NEXT_PUBLIC_SOCKET_URL`).
3. **Web Push** — avisos del SO con app en segundo plano / cerrada (VAPID en backend).

No uses el socket para garantizar entrega: push despierta el dispositivo; la BD guarda el historial.

## Env frontend

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SOCKET_URL` | Base URL del API/socket (ej. `https://back-….vercel.app`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Fallback si falla `GET /notifications/push/vapid-public-key`. **Debe ser igual** a `VAPID_PUBLIC_KEY` del backend. |
| `NEXT_PUBLIC_ENABLE_PUSH_ON_LOCALHOST` | Solo `"true"` si quieres suscribir Web Push en `localhost` (por defecto no se registra). |

## Env backend

| Variable | Uso |
|----------|-----|
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Par VAPID (si faltan, push deshabilitado) |
| `VAPID_SUBJECT` | Contacto VAPID (default `mailto:…`) |

Generar claves: `npx web-push generate-vapid-keys`.

### Reglas VAPID (revisar primero en prod)

- El **mismo par** público/privado debe usarse al suscribir y al enviar.
- No mezclar VAPID A en local y VAPID B en prod si reutilizas filas de `suscripciones_push`.
- Rotar claves ⇒ hay que re-activar notificaciones en cada dispositivo.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = `VAPID_PUBLIC_KEY`. La **privada jamás** va al front ni a `NEXT_PUBLIC_*`.
- Comprobar: `GET /api/notifications/push/vapid-public-key` → `{ enabled: true, publicKey: "…" }`.

## Ciclo de permiso

- Pre-prompt en el CRM → click → `Notification.requestPermission()` (gesto).
- `granted` → Service Worker + `PushManager.subscribe` → POST `/notifications/push/subscribe`.
- Logout / permiso `denied` → unsubscribe local + DELETE en servidor.
- “Ahora no” en el gate: no vuelve a mostrar en la misma sesión; se puede activar en Perfil.
- En **localhost** no se registra push salvo `NEXT_PUBLIC_ENABLE_PUSH_ON_LOCALHOST=true` (evita clicks que abren localhost).

## Diagnóstico móvil (antes de tocar Socket.IO)

### 1. Service Worker

Android Chrome → `chrome://inspect` sobre el origen de **producción**:

- Service Worker → `/sw.js` → **activated**

Sin SW activated no hay push aunque Nest y Socket estén bien.

### 2. PushSubscription

En consola del origen prod:

```js
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.getSubscription();
console.log(subscription);
```

- Objeto con `endpoint` → OK para enviar.
- `null` → problema antes de Nest (permiso, VAPID, subscribe). Activar en Perfil y revisar fila en `suscripciones_push`.

### 3. Prueba aislada

`POST /notifications/push/test` (JWT) o botón **Probar push** en Perfil.

- Solo Web Push al usuario actual (sin historial in-app ni Socket).
- Respuesta: `{ enabled, sent }`.
  - `enabled: false` → faltan VAPID en backend.
  - `sent: 0` → no hay suscripciones activas.
  - Llega al teléfono → VAPID + SW + permiso + suscripción OK → entonces probar WhatsApp / `CrearNotificacionUseCase`.

## Matriz de prueba real

| Escenario | Esperado |
|-----------|----------|
| App abierta / enfocada | Socket → toast/sonido; SW no muestra toast del SO |
| App en background | Web Push → notificación SO |
| Teléfono bloqueado | Web Push → notificación SO |
| PWA cerrada | Web Push → SO; al abrir, campana/unread sincroniza desde BD |
| Tap en notificación | Abre origen prod + ruta (`/chats/…`, `/leads/…`, o `payload.url`) |

### iOS (Safari 16.4+)

Solo con PWA en **Pantalla de inicio**, abierta desde el icono, permiso en HTTPS. Safari en pestaña = “no-soportado” (esperado).

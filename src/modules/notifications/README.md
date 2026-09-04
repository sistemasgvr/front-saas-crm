# Notificaciones (in-app + Socket + Web Push)

## Capas

1. **In-app** — campana, lista `/notifications`, leídas.
2. **Socket.IO** — toast + sonido con la pestaña abierta (`NEXT_PUBLIC_SOCKET_URL`).
3. **Web Push** — avisos del SO con app en segundo plano / cerrada (VAPID en backend).

## Env frontend

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SOCKET_URL` | Base URL del API/socket (ej. `http://localhost:3001`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Fallback opcional si falla `GET /notifications/push/vapid-public-key` |

## Env backend

| Variable | Uso |
|----------|-----|
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push (si faltan, push deshabilitado) |
| `VAPID_SUBJECT` | Contacto VAPID (default `mailto:…`) |

Generar claves: `npx web-push generate-vapid-keys`.

## Ciclo de permiso (Notifications API)

- Pre-prompt en el CRM → click → `Notification.requestPermission()` (gesto).
- `granted` → Service Worker + `PushManager.subscribe` → POST `/notifications/push/subscribe`.
- Logout / permiso `denied` → unsubscribe local + DELETE en servidor.
- “Ahora no” en el gate: no vuelve a mostrar en la misma sesión; se puede activar en Perfil.

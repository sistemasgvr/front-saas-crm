# Notificaciones (in-app + Socket + Web Push)

## Capas

1. **In-app** — campana, lista `/notifications`, leídas (`GET` unread / lista = fuente de verdad al reabrir).
2. **Socket.IO** — toast + sonido con la pestaña abierta (`NEXT_PUBLIC_SOCKET_URL`).
3. **Web Push** — avisos del SO con app en segundo plano / cerrada (VAPID en backend).

No uses el socket para garantizar entrega: push despierta el dispositivo; la BD guarda el historial.

## Límites del SO (vs WhatsApp nativo)

Web Push **no puede**:
- Usar la foto del contacto como icono de la notificación.
- Quitar del todo `CRM • crm.proyectosgvr.com` / `from CRM` (lo pone el SO / PWA).
- Sonar o agrupar exactamente como la app WhatsApp.

**Sí hace** el CRM:
- Título = nombre del contacto/lead.
- Cuerpo = texto del mensaje (o “Envió un sticker…”) truncado con `…`.
- Icono = marca (sin texto “CRM” en `/icon.png`).

## Env frontend

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SOCKET_URL` | Base URL del API/socket (ej. `https://back-….vercel.app`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Fallback **solo si falla** el GET del API. Debe ser igual a `VAPID_PUBLIC_KEY`. |
| `NEXT_PUBLIC_ENABLE_PUSH_ON_LOCALHOST` | Solo `"true"` si quieres suscribir Web Push en `localhost`. |

## Env backend

| Variable | Uso |
|----------|-----|
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Par VAPID (si faltan, push deshabilitado) |
| `VAPID_SUBJECT` | Contacto VAPID (default `mailto:…`) |

Generar: `npx web-push generate-vapid-keys`. Mismo par en todos los entornos que compartan `suscripciones_push`.

## Ciclo de permiso

- Pre-prompt → gesto → `Notification.requestPermission()`.
- `granted` → SW + subscribe → POST `/notifications/push/subscribe`.
- Si la `applicationServerKey` local no coincide con VAPID actual → re-suscribe y DELETE del endpoint viejo.
- Logout / `denied` → unsubscribe local + DELETE.
- Localhost: no registra push salvo flag.

## Quién recibe qué

| Evento | Destinatarios |
|--------|----------------|
| WhatsApp con lead **asignado** | Solo el asignado |
| WhatsApp sin lead / sin asignar | Toda la org (usuarios activos) |
| Lead nuevo con auto-asignación | El asignado |
| Lead nuevo **sin** asignado | Toda la org activa |
| Agenda | El destinatario del recordatorio |

## Diagnóstico: “a este usuario no le llega”

1. Permiso `granted` en el origen de **producción** (no localhost).
2. SW `/sw.js` **activated** (`chrome://inspect` en Android).
3. `getSubscription()` no es `null`.
4. Fila activa en `suscripciones_push` para ese `usuarioId`.
5. Si el lead está asignado a **otro** usuario → no debe llegarle (esperado).
6. iOS: solo PWA en pantalla de inicio, abierta desde el icono.
7. App **enfocada**: el SW no muestra toast del SO (usa socket/toast in-app). Probar en background.
8. Perfil → **Probar push** → `{ enabled, attempted, delivered, failed }`.

## Prueba aislada

`POST /notifications/push/test` o botón en Perfil.

- Solo Web Push (sin historial ni socket).
- Respuesta honesta: `delivered` / `failed`, no “sent” inflado.

## Matriz de prueba

| Escenario | Esperado |
|-----------|----------|
| App abierta / enfocada | Socket → toast; SW sin toast SO |
| Background / bloqueado / PWA cerrada | Web Push → notificación SO |
| Tap | Origen prod + ruta (`/chats/…`, `/leads/…`) |

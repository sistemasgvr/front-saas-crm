"use client";

const SONIDO_WHATSAPP = "/sounds/whatsapp-message.wav";
const SONIDO_GENERAL = "/sounds/notification.wav";

let audioWhatsapp: HTMLAudioElement | null = null;
let audioGeneral: HTMLAudioElement | null = null;

function getAudio(tipo: string): HTMLAudioElement {
  if (tipo === "WHATSAPP_MENSAJE") {
    audioWhatsapp ??= new Audio(SONIDO_WHATSAPP);
    return audioWhatsapp;
  }
  audioGeneral ??= new Audio(SONIDO_GENERAL);
  return audioGeneral;
}

/**
 * Sonido distinto para un mensaje de WhatsApp que para el resto de
 * notificaciones (lead nuevo, salud de webhook, etc.) — a propósito, para
 * poder distinguir de oído cuál llegó sin mirar la pantalla.
 *
 * Si el navegador todavía bloquea el audio (todavía no hubo ninguna
 * interacción del usuario en la pestaña — política de autoplay), falla en
 * silencio: no debe romper el resto del flujo de notificaciones.
 */
export function reproducirSonidoNotificacion(tipo: string): void {
  try {
    const audio = getAudio(tipo);
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  } catch {
    // Entornos sin `Audio` (SSR) — no hacer nada.
  }
}

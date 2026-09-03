"use client";

/**
 * Feedback estilo WhatsApp al enviar: sonido corto "pop/whoosh" + (en UI)
 * animación de la burbuja. Sintetizado con Web Audio para no depender de
 * assets con copyright de Meta.
 */

let audioCtx: AudioContext | null = null;

function obtenerAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  audioCtx ??= new AC();
  if (audioCtx.state === "suspended") {
    void audioCtx.resume().catch(() => undefined);
  }
  return audioCtx;
}

/** Desbloquea audio en la primera interacción del composer (política autoplay). */
export function desbloquearAudioChat(): void {
  obtenerAudioContext();
}

/**
 * Sonido de envío al estilo WhatsApp: pop breve + caída de tono (~80ms).
 * Falla en silencio si el navegador bloquea audio.
 */
export function reproducirSonidoEnvio(): void {
  try {
    const ac = obtenerAudioContext();
    if (!ac) return;
    const t0 = ac.currentTime;

    // Burst de ruido filtrado (el "pop").
    const durRuido = 0.045;
    const samples = Math.max(1, Math.floor(ac.sampleRate * durRuido));
    const buffer = ac.createBuffer(1, samples, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      const env = Math.exp(-3.5 * (i / samples));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const ruido = ac.createBufferSource();
    ruido.buffer = buffer;
    const filtro = ac.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.setValueAtTime(1600, t0);
    filtro.Q.value = 0.9;
    const gainRuido = ac.createGain();
    gainRuido.gain.setValueAtTime(0.22, t0);
    gainRuido.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);
    ruido.connect(filtro);
    filtro.connect(gainRuido);
    gainRuido.connect(ac.destination);
    ruido.start(t0);

    // Tono suave descendente (el "whoosh" corto).
    const osc = ac.createOscillator();
    const gainOsc = ac.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(640, t0);
    osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.075);
    gainOsc.gain.setValueAtTime(0.11, t0);
    gainOsc.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    osc.connect(gainOsc);
    gainOsc.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + 0.1);
  } catch {
    // SSR / autoplay bloqueado — no romper el envío.
  }
}

/** Llamar en onSuccess de cualquier envío saliente del chat. */
export function feedbackMensajeEnviado(): void {
  reproducirSonidoEnvio();
}

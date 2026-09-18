"use client";

/** Ring tono sintético (sin asset externo) para llamadas entrantes. */
let ringCtx: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ringCtx ??= new AudioContext();
    return ringCtx;
  } catch {
    return null;
  }
}

function beepOnce(): void {
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume().catch(() => undefined);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 440;
  gain.gain.value = 0.08;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  osc.start(now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.stop(now + 0.4);
}

export function iniciarRingLlamada(): void {
  detenerRingLlamada();
  beepOnce();
  ringTimer = setInterval(beepOnce, 1800);
}

export function detenerRingLlamada(): void {
  if (ringTimer) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
}

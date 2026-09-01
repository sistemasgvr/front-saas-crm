"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "crm-whatsapp-borradores-v1";

export type BorradoresPorChat = Record<string, string>;

/** Referencia estable — React exige que getServerSnapshot no devuelva un objeto nuevo en cada llamada. */
const BORRADORES_VACIOS: BorradoresPorChat = Object.freeze({});

const listeners = new Set<() => void>();

let snapshotCache: BorradoresPorChat = BORRADORES_VACIOS;
let snapshotRaw: string | null = null;

function invalidarCacheSnapshot() {
  snapshotRaw = null;
}

function emitirCambio() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function leerDesdeStorage(): BorradoresPorChat {
  if (typeof window === "undefined") return BORRADORES_VACIOS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === snapshotRaw) return snapshotCache;
    snapshotRaw = raw;
    if (!raw) {
      snapshotCache = BORRADORES_VACIOS;
      return snapshotCache;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      snapshotCache = BORRADORES_VACIOS;
      return snapshotCache;
    }
    snapshotCache = parsed as BorradoresPorChat;
    return snapshotCache;
  } catch {
    snapshotCache = BORRADORES_VACIOS;
    snapshotRaw = null;
    return snapshotCache;
  }
}

function escribirEnStorage(borradores: BorradoresPorChat) {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(borradores).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(borradores));
    }
    invalidarCacheSnapshot();
    emitirCambio();
  } catch {
    // localStorage lleno o bloqueado — no romper el chat
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      invalidarCacheSnapshot();
      emitirCambio();
    }
  });
}

export function getBorrador(conversacionId: string): string | undefined {
  const texto = leerDesdeStorage()[conversacionId];
  return texto?.length ? texto : undefined;
}

export function clearBorrador(conversacionId: string) {
  invalidarCacheSnapshot();
  const borradores = { ...leerDesdeStorage() };
  if (!(conversacionId in borradores)) return;
  delete borradores[conversacionId];
  escribirEnStorage(borradores);
}

/** Guarda el borrador del chat. Si queda vacío (solo espacios), lo elimina. */
export function setBorrador(conversacionId: string, texto: string) {
  if (!texto.trim()) {
    clearBorrador(conversacionId);
    return;
  }
  const borradores = { ...leerDesdeStorage() };
  borradores[conversacionId] = texto;
  escribirEnStorage(borradores);
}

export function useChatBorradores(): BorradoresPorChat {
  return useSyncExternalStore(subscribe, leerDesdeStorage, () => BORRADORES_VACIOS);
}

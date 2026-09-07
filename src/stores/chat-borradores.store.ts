"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

const STORAGE_KEY = "crm-whatsapp-borradores-v3";
/** Claves legacy — se migran una vez y se eliminan. */
const LEGACY_KEYS = ["crm-whatsapp-borradores-v2", "crm-whatsapp-borradores-v1"] as const;

export type BorradoresPorChat = Record<string, string>;

function limpiarMapa(raw: unknown): BorradoresPorChat {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: BorradoresPorChat = {};
  for (const [id, texto] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof id === "string" && typeof texto === "string" && texto.trim()) {
      out[id] = texto;
    }
  }
  return out;
}

function leerLocalStorage(key: string): BorradoresPorChat {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    return limpiarMapa(JSON.parse(raw) as unknown);
  } catch {
    return {};
  }
}

function persistirSync(byChat: BorradoresPorChat) {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(byChat).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(byChat));
    }
  } catch {
    // Quota / modo privado — no tumbar el chat.
  }
}

/**
 * Carga síncrona al crear el store.
 * Evita el race clásico de `persist` (rehydrate async): el usuario borra el
 * borrador y un snapshot viejo de localStorage lo vuelve a escribir encima.
 */
function cargarInicial(): BorradoresPorChat {
  if (typeof window === "undefined") return {};

  let byChat = leerLocalStorage(STORAGE_KEY);

  for (const legacy of LEGACY_KEYS) {
    const viejo = leerLocalStorage(legacy);
    if (Object.keys(viejo).length === 0) continue;
    byChat = { ...viejo, ...byChat };
    try {
      window.localStorage.removeItem(legacy);
    } catch {
      /* ignore */
    }
  }

  persistirSync(byChat);
  return byChat;
}

interface ChatBorradoresState {
  byChat: BorradoresPorChat;
  setBorrador: (conversacionId: string, texto: string) => void;
  clearBorrador: (conversacionId: string) => void;
}

function crearStore() {
  return create<ChatBorradoresState>()((set, get) => ({
    byChat: cargarInicial(),

    setBorrador: (conversacionId, texto) => {
      if (!texto.trim()) {
        get().clearBorrador(conversacionId);
        return;
      }
      if (get().byChat[conversacionId] === texto) return;
      const byChat = { ...get().byChat, [conversacionId]: texto };
      set({ byChat });
      persistirSync(byChat);
    },

    clearBorrador: (conversacionId) => {
      if (!(conversacionId in get().byChat)) {
        // Aun si la memoria ya está limpia, forzar storage por si quedó basura.
        persistirSync(get().byChat);
        return;
      }
      const { [conversacionId]: _quitado, ...rest } = get().byChat;
      set({ byChat: rest });
      persistirSync(rest);
    },
  }));
}

type StoreApi = ReturnType<typeof crearStore>;

/**
 * Singleton en `globalThis` — en Next/HMR a veces se evalúa el módulo 2 veces
 * y acabarías con dos stores (el composer limpia A y la lista lee B).
 */
const GLOBAL_KEY = "__gvr_chat_borradores_store_v3__";

function obtenerStore(): StoreApi {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: StoreApi };
  g[GLOBAL_KEY] ??= crearStore();
  return g[GLOBAL_KEY];
}

export const useChatBorradoresStore = obtenerStore();

export function getBorrador(conversacionId: string): string | undefined {
  const texto = useChatBorradoresStore.getState().byChat[conversacionId];
  return texto?.trim() ? texto : undefined;
}

export function setBorrador(conversacionId: string, texto: string) {
  useChatBorradoresStore.getState().setBorrador(conversacionId, texto);
}

export function clearBorrador(conversacionId: string) {
  useChatBorradoresStore.getState().clearBorrador(conversacionId);
}

export function useChatBorradores(): BorradoresPorChat {
  return useChatBorradoresStore(useShallow((s) => s.byChat));
}

export function useBorradorChat(conversacionId: string): string {
  return useChatBorradoresStore((s) => s.byChat[conversacionId] ?? "");
}

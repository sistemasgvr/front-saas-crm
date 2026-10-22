"use client";

import { create } from "zustand";

interface TiempoRealState {
  /** Socket de notificaciones conectado: los cambios llegan en vivo. */
  conectado: boolean;
  setConectado: (conectado: boolean) => void;
}

export const useTiempoRealStore = create<TiempoRealState>()((set) => ({
  conectado: false,
  setConectado: (conectado) => set({ conectado }),
}));

/** Con el socket vivo, el polling es solo una red de seguridad: se espacia
 * para no cargar el backend con pedidos que el socket ya hace innecesarios. */
const FACTOR_CON_SOCKET = 4;

/**
 * Intervalo de polling de respaldo para `refetchInterval` de React Query:
 * - pestaña oculta → sin polling (al volver se refresca igual);
 * - socket caído → `msSinSocket` (el polling es lo único que trae cambios);
 * - socket conectado → `msSinSocket × 4`.
 */
export function intervaloDeRespaldo(msSinSocket: number): number | false {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    return false;
  }
  return useTiempoRealStore.getState().conectado
    ? msSinSocket * FACTOR_CON_SOCKET
    : msSinSocket;
}

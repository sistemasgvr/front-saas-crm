"use client";

import { create } from "zustand";
import type {
  FaseLlamadaUi,
  LlamadaEndedSocket,
  LlamadaIncomingSocket,
  WhatsappLlamada,
} from "./types";

export type ActiveCallState = {
  callId: string;
  id?: string;
  conversacionId?: string | null;
  leadId?: string | null;
  waId?: string | null;
  nombreContacto?: string | null;
  direccion: "ENTRANTE" | "SALIENTE";
  sdpOffer?: string | null;
  startedAt?: number;
};

interface CallStoreState {
  fase: FaseLlamadaUi;
  incoming: LlamadaIncomingSocket | null;
  active: ActiveCallState | null;
  postCall: WhatsappLlamada | null;
  muted: boolean;
  error: string | null;
  setIncoming: (data: LlamadaIncomingSocket) => void;
  clearIncoming: () => void;
  setConnecting: (active: ActiveCallState) => void;
  setActive: (active: ActiveCallState) => void;
  setOutgoing: (active: ActiveCallState) => void;
  setMuted: (muted: boolean) => void;
  setError: (error: string | null) => void;
  onRemoteEnded: (data: LlamadaEndedSocket) => void;
  openPostCall: (llamada: WhatsappLlamada) => void;
  clearPostCall: () => void;
  reset: () => void;
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  fase: "idle",
  incoming: null,
  active: null,
  postCall: null,
  muted: false,
  error: null,

  setIncoming: (data) => {
    const { fase, active } = get();
    if (fase === "active" || fase === "connecting" || fase === "outgoing") return;
    if (active?.callId === data.callId) return;
    set({
      fase: "ringing",
      incoming: data,
      error: null,
    });
  },

  clearIncoming: () => {
    set({ incoming: null, fase: get().active ? get().fase : "idle" });
  },

  setConnecting: (active) => {
    set({ fase: "connecting", active, incoming: null, muted: false, error: null });
  },

  setActive: (active) => {
    set({
      fase: "active",
      active: { ...active, startedAt: active.startedAt ?? Date.now() },
      incoming: null,
      error: null,
    });
  },

  setOutgoing: (active) => {
    set({
      fase: "outgoing",
      active,
      incoming: null,
      muted: false,
      error: null,
    });
  },

  setMuted: (muted) => set({ muted }),

  setError: (error) => set({ error }),

  onRemoteEnded: (data) => {
    const { active, incoming, fase } = get();
    const matches =
      active?.callId === data.callId ||
      incoming?.callId === data.callId ||
      active?.id === data.id ||
      incoming?.id === data.id;

    if (!matches && fase !== "ringing") return;

    const post: WhatsappLlamada | null = active
      ? {
          id: data.id || active.id || "",
          callId: data.callId,
          direccion: active.direccion,
          estado: data.estado,
          resultado: data.resultado ?? null,
          inicioEn: new Date(active.startedAt ?? Date.now()).toISOString(),
          finEn: new Date().toISOString(),
          duracionSeg: data.duracionSeg ?? null,
          conversacionId: active.conversacionId,
          leadId: active.leadId,
          waId: active.waId,
          nombreContacto: active.nombreContacto,
        }
      : null;

    set({
      fase: post ? "ended" : "idle",
      incoming: null,
      active: null,
      muted: false,
      postCall: post,
    });
  },

  openPostCall: (llamada) => {
    set({ postCall: llamada, fase: "ended", active: null, incoming: null });
  },

  clearPostCall: () => set({ postCall: null, fase: "idle" }),

  reset: () =>
    set({
      fase: "idle",
      incoming: null,
      active: null,
      postCall: null,
      muted: false,
      error: null,
    }),
}));

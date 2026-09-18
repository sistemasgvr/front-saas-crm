"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { setPresenciaAction, iniciarLlamadaSalienteAction } from "./actions";
import CallOverlay from "./CallOverlay";
import { useCallStore } from "./call-store";
import { getIceServers } from "./queries";
import { clearSharedCallSession, setSharedCallSession } from "./shared-session";
import { WebrtcSession } from "./webrtc-session";

export async function iniciarLlamadaSalienteDesdeUi(input: {
  conversacionId: string;
  nombreContacto?: string | null;
  waId?: string | null;
  leadId?: string | null;
}): Promise<void> {
  const store = useCallStore.getState();
  if (store.fase !== "idle" && store.fase !== "ended") {
    toast.error("Ya hay una llamada en curso");
    return;
  }

  clearSharedCallSession();
  const ice = await getIceServers();
  if (!ice.ready || !ice.iceServers?.length) {
    throw new Error("Servidores ICE no configurados. Contacta al administrador.");
  }

  const session = new WebrtcSession({
    onError: (msg) => {
      useCallStore.getState().setError(msg);
      toast.error(msg);
    },
  });
  setSharedCallSession(session);

  await session.createPeerConnection(ice.iceServers);
  await session.attachLocalAudio();
  const sdp = await session.createOutgoingOffer();

  store.setOutgoing({
    callId: "pending",
    conversacionId: input.conversacionId,
    leadId: input.leadId,
    waId: input.waId,
    nombreContacto: input.nombreContacto,
    direccion: "SALIENTE",
  });

  try {
    const llamada = await iniciarLlamadaSalienteAction({
      conversacionId: input.conversacionId,
      sdp,
    });
    store.setActive({
      callId: llamada.callId,
      id: llamada.id,
      conversacionId: llamada.conversacionId ?? input.conversacionId,
      leadId: llamada.leadId ?? input.leadId,
      waId: llamada.waId ?? input.waId,
      nombreContacto: input.nombreContacto,
      direccion: "SALIENTE",
      startedAt: Date.now(),
    });
  } catch (err) {
    clearSharedCallSession();
    store.reset();
    throw err;
  }
}

interface CallProviderProps {
  enabled: boolean;
  children?: React.ReactNode;
}

/**
 * Overlay global + presencia disponible al montar (y baja al desmontar).
 * El socket de llamadas vive en useNotificationsSocket.
 */
export default function CallProvider({ enabled, children }: CallProviderProps) {
  useEffect(() => {
    if (!enabled) return;
    void setPresenciaAction(true).catch(() => undefined);

    return () => {
      void setPresenciaAction(false).catch(() => undefined);
      clearSharedCallSession();
      useCallStore.getState().reset();
    };
  }, [enabled]);

  if (!enabled) return children ?? null;

  return (
    <>
      {children}
      <CallOverlay />
    </>
  );
}

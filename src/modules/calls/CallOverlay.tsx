"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Button from "@/src/components/ui/button/Button";
import Input from "@/src/components/form/input/InputField";
import Select from "@/src/components/form/Select";
import Modal from "@/src/components/ui/modal/Modal";
import { Icon } from "@/src/components/ui/Icon";
import { Spinner } from "@/src/components/ui/Spinner";
import { queryKeys } from "@/src/lib/query/keys";
import {
  acceptLlamadaAction,
  actualizarLlamadaAction,
  preAcceptLlamadaAction,
  rejectLlamadaAction,
  terminateLlamadaAction,
} from "./actions";
import { detenerRingLlamada } from "./call-sounds";
import { useCallStore } from "./call-store";
import { getIceServers } from "./queries";
import {
  formatearDuracionSeg,
  MOTIVOS_POST_LLAMADA,
  type MotivoPostLlamada,
} from "./types";
import {
  clearSharedCallSession,
  getSharedCallSession,
  setSharedCallSession,
} from "./shared-session";
import { listarDispositivosAudio, WebrtcSession } from "./webrtc-session";

function etiquetaContacto(nombre?: string | null, waId?: string | null): string {
  return nombre?.trim() || waId || "Contacto WhatsApp";
}

export default function CallOverlay() {
  const queryClient = useQueryClient();
  const fase = useCallStore((s) => s.fase);
  const incoming = useCallStore((s) => s.incoming);
  const active = useCallStore((s) => s.active);
  const postCall = useCallStore((s) => s.postCall);
  const muted = useCallStore((s) => s.muted);
  const error = useCallStore((s) => s.error);
  const setMuted = useCallStore((s) => s.setMuted);
  const setError = useCallStore((s) => s.setError);
  const setConnecting = useCallStore((s) => s.setConnecting);
  const setActive = useCallStore((s) => s.setActive);
  const openPostCall = useCallStore((s) => s.openPostCall);
  const clearPostCall = useCallStore((s) => s.clearPostCall);
  const reset = useCallStore((s) => s.reset);
  const clearIncoming = useCallStore((s) => s.clearIncoming);

  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [inputId, setInputId] = useState("");
  const [outputId, setOutputId] = useState("");
  const [nota, setNota] = useState("");
  const [motivo, setMotivo] = useState<MotivoPostLlamada | "">("");
  const [guardandoNota, setGuardandoNota] = useState(false);

  const invalidarLlamadas = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappCalls });
  }, [queryClient]);

  const ensureSession = useCallback(() => {
    let session = getSharedCallSession();
    if (!session) {
      session = new WebrtcSession({
        onError: (msg) => {
          setError(msg);
          toast.error(msg);
        },
        onIceConnectionState: (state) => {
          if (state === "failed") {
            toast.error(
              "Conexión ICE fallida. Verifica firewall/VPN o la config TURN del servidor.",
            );
          }
        },
      });
      setSharedCallSession(session);
    }
    return session;
  }, [setError]);

  const cleanupSession = useCallback(() => {
    clearSharedCallSession();
  }, []);

  useEffect(() => {
    if (fase === "ringing") return;
    detenerRingLlamada();
  }, [fase]);

  useEffect(() => {
    if (fase !== "active" || !active?.startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Math.floor((Date.now() - (active.startedAt ?? Date.now())) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fase, active?.startedAt]);

  useEffect(() => {
    if (fase !== "active") return;
    void listarDispositivosAudio().then(({ inputs: i, outputs: o }) => {
      setInputs(i);
      setOutputs(o);
      if (i[0] && !inputId) setInputId(i[0].deviceId);
      if (o[0] && !outputId) setOutputId(o[0].deviceId);
    });
  }, [fase, inputId, outputId]);

  const handleAccept = async () => {
    if (!incoming?.callId || !incoming.sdpOffer) {
      toast.error("La llamada no incluye oferta SDP.");
      return;
    }
    setBusy(true);
    detenerRingLlamada();
    try {
      const ice = await getIceServers();
      if (!ice.ready || !ice.iceServers?.length) {
        throw new Error("Servidores ICE no configurados. Contacta al administrador.");
      }
      const session = ensureSession();
      await session.createPeerConnection(ice.iceServers);
      await session.attachLocalAudio();
      const sdp = await session.answerIncomingOffer(incoming.sdpOffer);

      setConnecting({
        callId: incoming.callId,
        id: incoming.id,
        conversacionId: incoming.conversacionId,
        leadId: incoming.leadId,
        waId: incoming.waId,
        nombreContacto: incoming.nombreContacto,
        direccion: "ENTRANTE",
        sdpOffer: incoming.sdpOffer,
      });

      await preAcceptLlamadaAction(incoming.callId, sdp);
      const llamada = await acceptLlamadaAction(incoming.callId, sdp);

      setActive({
        callId: incoming.callId,
        id: llamada.id || incoming.id,
        conversacionId: llamada.conversacionId ?? incoming.conversacionId,
        leadId: llamada.leadId ?? incoming.leadId,
        waId: llamada.waId ?? incoming.waId,
        nombreContacto: incoming.nombreContacto,
        direccion: "ENTRANTE",
        startedAt: Date.now(),
      });
      invalidarLlamadas();
    } catch (err) {
      cleanupSession();
      reset();
      const msg = err instanceof Error ? err.message : "No se pudo aceptar la llamada";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!incoming?.callId) return;
    setBusy(true);
    detenerRingLlamada();
    try {
      await rejectLlamadaAction(incoming.callId);
      clearIncoming();
      reset();
      invalidarLlamadas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo rechazar");
    } finally {
      setBusy(false);
    }
  };

  const handleHangup = async () => {
    const call = active;
    if (!call?.callId || call.callId === "pending") {
      cleanupSession();
      reset();
      return;
    }
    setBusy(true);
    try {
      const llamada = await terminateLlamadaAction(call.callId);
      cleanupSession();
      openPostCall({
        ...llamada,
        nombreContacto: call.nombreContacto,
        duracionSeg:
          llamada.duracionSeg ??
          (call.startedAt ? Math.floor((Date.now() - call.startedAt) / 1000) : null),
      });
      invalidarLlamadas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo colgar");
      cleanupSession();
      reset();
    } finally {
      setBusy(false);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    getSharedCallSession()?.setMuted(next);
    setMuted(next);
  };

  const onChangeInput = async (deviceId: string) => {
    setInputId(deviceId);
    try {
      await getSharedCallSession()?.setInputDevice(deviceId);
    } catch {
      toast.error("No se pudo cambiar el micrófono");
    }
  };

  const onChangeOutput = async (deviceId: string) => {
    setOutputId(deviceId);
    try {
      await getSharedCallSession()?.setOutputDevice(deviceId);
    } catch {
      toast.error("No se pudo cambiar el altavoz");
    }
  };

  const guardarPostCall = async () => {
    if (!postCall?.id) {
      clearPostCall();
      return;
    }
    setGuardandoNota(true);
    try {
      await actualizarLlamadaAction(postCall.id, {
        notaPostLlamada: nota.trim() || undefined,
        motivo: motivo || undefined,
      });
      toast.success("Nota guardada");
      clearPostCall();
      setNota("");
      setMotivo("");
      invalidarLlamadas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardandoNota(false);
    }
  };

  useEffect(() => {
    if (fase === "ended" || fase === "idle") {
      cleanupSession();
    }
  }, [fase, cleanupSession]);

  const visible =
    fase === "ringing" ||
    fase === "connecting" ||
    fase === "active" ||
    fase === "outgoing";

  if (!visible && !postCall) return null;

  const nombre =
    fase === "ringing"
      ? etiquetaContacto(incoming?.nombreContacto, incoming?.waId)
      : etiquetaContacto(active?.nombreContacto, active?.waId);

  return (
    <>
      {visible ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100000] flex justify-center px-3 sm:bottom-6">
          <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  fase === "ringing"
                    ? "animate-pulse bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                    : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                }`}
              >
                <Icon name="mdi:phone" size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                  {nombre}
                </p>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  {fase === "ringing" && "Llamada entrante"}
                  {fase === "connecting" && "Conectando…"}
                  {fase === "outgoing" && "Llamando…"}
                  {fase === "active" && `En llamada · ${formatearDuracionSeg(elapsed)}`}
                </p>
              </div>
              {busy ? <Spinner size={18} /> : null}
            </div>

            {error ? (
              <p className="border-b border-error-100 bg-error-50 px-4 py-2 text-theme-xs text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </p>
            ) : null}

            {fase === "ringing" ? (
              <div className="flex gap-2 p-4">
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => void handleReject()}
                  startIcon={<Icon name="mdi:phone-hangup" size={18} />}
                >
                  Rechazar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 !bg-success-500 hover:!bg-success-600"
                  disabled={busy}
                  loading={busy}
                  onClick={() => void handleAccept()}
                  startIcon={<Icon name="mdi:phone" size={18} />}
                >
                  Aceptar
                </Button>
              </div>
            ) : null}

            {(fase === "active" || fase === "outgoing" || fase === "connecting") && (
              <div className="space-y-3 p-4">
                {fase === "active" ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Select
                      options={inputs.map((d) => ({
                        value: d.deviceId,
                        label: d.label || "Micrófono",
                      }))}
                      value={inputId}
                      onChange={(v) => void onChangeInput(v)}
                      placeholder="Micrófono"
                    />
                    <Select
                      options={outputs.map((d) => ({
                        value: d.deviceId,
                        label: d.label || "Altavoz",
                      }))}
                      value={outputId}
                      onChange={(v) => void onChangeOutput(v)}
                      placeholder="Altavoz"
                    />
                  </div>
                ) : null}
                <div className="flex gap-2">
                  {fase === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={toggleMute}
                      startIcon={
                        <Icon name={muted ? "mdi:microphone-off" : "mdi:microphone"} size={18} />
                      }
                    >
                      {muted ? "Activar mic" : "Silenciar"}
                    </Button>
                  ) : null}
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    disabled={busy}
                    loading={busy}
                    onClick={() => void handleHangup()}
                    startIcon={<Icon name="mdi:phone-hangup" size={18} />}
                  >
                    Colgar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(postCall)}
        onClose={() => {
          clearPostCall();
          setNota("");
          setMotivo("");
        }}
        header={
          <div className="pr-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Resumen de llamada
            </h3>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              Duración: {formatearDuracionSeg(postCall?.duracionSeg)}
              {postCall?.nombreContacto ? ` · ${postCall.nombreContacto}` : ""}
            </p>
          </div>
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearPostCall();
                setNota("");
                setMotivo("");
              }}
            >
              Omitir
            </Button>
            <Button size="sm" loading={guardandoNota} onClick={() => void guardarPostCall()}>
              Guardar
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-1">
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Motivo
            </label>
            <Select
              options={MOTIVOS_POST_LLAMADA.map((m) => ({
                value: m.value,
                label: m.label,
              }))}
              value={motivo}
              onChange={(v) => setMotivo(v as MotivoPostLlamada)}
              placeholder="Selecciona un motivo"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Nota
            </label>
            <Input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Resumen breve de la llamada…"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

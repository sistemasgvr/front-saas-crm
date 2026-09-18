"use client";

import "webrtc-adapter";

const ICE_GATHER_TIMEOUT_MS = 2000;

export type WebrtcSessionCallbacks = {
  onIceConnectionState?: (state: RTCIceConnectionState) => void;
  onConnectionState?: (state: RTCPeerConnectionState) => void;
  onIceRestartNeeded?: () => void;
  onError?: (message: string) => void;
  onRemoteTrack?: (stream: MediaStream) => void;
};

export class WebrtcSession {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private remoteAudioEl: HTMLAudioElement | null = null;
  private callbacks: WebrtcSessionCallbacks;
  /** SDP answer cached so pre_accept and accept use the identical string. */
  private cachedAnswerSdp: string | null = null;

  constructor(callbacks: WebrtcSessionCallbacks = {}) {
    this.callbacks = callbacks;
  }

  get answerSdp(): string | null {
    return this.cachedAnswerSdp;
  }

  get peerConnection(): RTCPeerConnection | null {
    return this.pc;
  }

  async createPeerConnection(iceServers: RTCIceServer[]): Promise<RTCPeerConnection> {
    this.closePeerOnly();
    const pc = new RTCPeerConnection({
      iceServers,
      iceTransportPolicy: "all",
    });
    this.pc = pc;

    pc.ontrack = (ev) => {
      const stream = ev.streams[0] ?? new MediaStream([ev.track]);
      this.remoteStream = stream;
      this.ensureRemoteAudio(stream);
      this.callbacks.onRemoteTrack?.(stream);
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      this.callbacks.onIceConnectionState?.(state);
      if (state === "failed") {
        this.callbacks.onError?.(
          "Falló la conexión ICE. Revisa red/firewall o la configuración TURN del servidor.",
        );
        this.callbacks.onIceRestartNeeded?.();
      }
    };

    pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionState?.(pc.connectionState);
      if (pc.connectionState === "failed") {
        this.callbacks.onError?.(
          "La llamada perdió la conexión. Intenta de nuevo o revisa TURN.",
        );
      }
    };

    return pc;
  }

  async attachLocalAudio(deviceId?: string): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
        video: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      const pc = this.pc;
      if (pc) {
        for (const track of stream.getAudioTracks()) {
          pc.addTrack(track, stream);
        }
      }
      return stream;
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        throw new Error(
          "Micrófono bloqueado. Permite el acceso al micrófono en el navegador para contestar llamadas.",
        );
      }
      if (name === "NotFoundError") {
        throw new Error("No se encontró un micrófono disponible.");
      }
      throw new Error("No se pudo acceder al micrófono.");
    }
  }

  /**
   * UIC: remote offer → local answer.
   * Returns the SDP answer string (also cached for identical pre_accept/accept).
   */
  async answerIncomingOffer(sdpOffer: string): Promise<string> {
    const pc = this.requirePc();
    await pc.setRemoteDescription({ type: "offer", sdp: sdpOffer });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    const sdp = await this.waitForIceComplete(pc);
    this.cachedAnswerSdp = sdp;
    return sdp;
  }

  /**
   * BIC: create local offer to send via POST /saliente.
   */
  async createOutgoingOffer(): Promise<string> {
    const pc = this.requirePc();
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    return this.waitForIceComplete(pc);
  }

  async applyRemoteAnswer(sdpAnswer: string): Promise<void> {
    const pc = this.requirePc();
    if (pc.signalingState === "stable" && pc.currentRemoteDescription) return;
    await pc.setRemoteDescription({ type: "answer", sdp: sdpAnswer });
  }

  async restartIce(): Promise<string | null> {
    const pc = this.pc;
    if (!pc) return null;
    try {
      pc.restartIce();
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      return this.waitForIceComplete(pc);
    } catch {
      this.callbacks.onError?.("No se pudo reiniciar ICE.");
      return null;
    }
  }

  setMuted(muted: boolean): void {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }

  async setInputDevice(deviceId: string): Promise<void> {
    const pc = this.pc;
    const old = this.localStream;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true },
      video: false,
    });
    this.localStream = stream;
    const newTrack = stream.getAudioTracks()[0];
    if (pc && newTrack) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
      if (sender) await sender.replaceTrack(newTrack);
      else pc.addTrack(newTrack, stream);
    }
    old?.getTracks().forEach((t) => t.stop());
  }

  async setOutputDevice(deviceId: string): Promise<void> {
    const el = this.remoteAudioEl;
    if (!el) return;
    const sinkIdSetter = (
      el as HTMLAudioElement & {
        setSinkId?: (id: string) => Promise<void>;
      }
    ).setSinkId;
    if (typeof sinkIdSetter === "function") {
      await sinkIdSetter.call(el, deviceId);
    }
  }

  close(): void {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.remoteStream = null;
    if (this.remoteAudioEl) {
      this.remoteAudioEl.srcObject = null;
      this.remoteAudioEl.remove();
      this.remoteAudioEl = null;
    }
    this.closePeerOnly();
    this.cachedAnswerSdp = null;
  }

  private closePeerOnly(): void {
    if (this.pc) {
      try {
        this.pc.ontrack = null;
        this.pc.oniceconnectionstatechange = null;
        this.pc.onconnectionstatechange = null;
        this.pc.close();
      } catch {
        /* ignore */
      }
      this.pc = null;
    }
  }

  private requirePc(): RTCPeerConnection {
    if (!this.pc) throw new Error("PeerConnection no inicializado");
    return this.pc;
  }

  private ensureRemoteAudio(stream: MediaStream): void {
    if (typeof document === "undefined") return;
    if (!this.remoteAudioEl) {
      const el = document.createElement("audio");
      el.autoplay = true;
      el.setAttribute("playsinline", "true");
      el.style.display = "none";
      document.body.appendChild(el);
      this.remoteAudioEl = el;
    }
    this.remoteAudioEl.srcObject = stream;
    void this.remoteAudioEl.play().catch(() => undefined);
  }

  private waitForIceComplete(pc: RTCPeerConnection): Promise<string> {
    if (pc.iceGatheringState === "complete") {
      return Promise.resolve(pc.localDescription?.sdp ?? "");
    }
    return new Promise((resolve) => {
      const done = () => {
        pc.removeEventListener("icegatheringstatechange", onChange);
        clearTimeout(timer);
        resolve(pc.localDescription?.sdp ?? "");
      };
      const onChange = () => {
        if (pc.iceGatheringState === "complete") done();
      };
      pc.addEventListener("icegatheringstatechange", onChange);
      const timer = setTimeout(done, ICE_GATHER_TIMEOUT_MS);
    });
  }
}

export async function listarDispositivosAudio(): Promise<{
  inputs: MediaDeviceInfo[];
  outputs: MediaDeviceInfo[];
}> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return { inputs: [], outputs: [] };
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    inputs: devices.filter((d) => d.kind === "audioinput"),
    outputs: devices.filter((d) => d.kind === "audiooutput"),
  };
}

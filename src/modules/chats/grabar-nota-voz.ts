"use client";

/**
 * Nota de voz para WhatsApp Cloud API.
 * Usa opus-recorder → OGG/Opus nativo (Chrome/Firefox), con voice:true.
 * Worker: /opus-recorder/encoderWorker.min.js
 */

import Recorder from "opus-recorder";

export type ResultadoGrabacion = {
  file: File;
  esVoz: boolean;
  duracionMs: number;
};

type OpusRecorderInstance = {
  start: () => Promise<void>;
  stop: () => void;
  close?: () => void;
  ondataavailable: ((data: ArrayBuffer) => void) | null;
  onstop: (() => void) | null;
};

export class GrabadorNotaVoz {
  private recorder: OpusRecorderInstance | null = null;
  private chunks: ArrayBuffer[] = [];
  private iniciadoEn = 0;
  private activo = false;

  async iniciar(): Promise<void> {
    if (this.activo) return;
    if (typeof Recorder.isRecordingSupported === "function" && !Recorder.isRecordingSupported()) {
      throw new Error("Este navegador no admite grabación de audio");
    }

    this.chunks = [];
    const recorder = new Recorder({
      encoderPath: "/opus-recorder/encoderWorker.min.js",
      encoderApplication: 2048, // VOIP
      encoderSampleRate: 48000,
      encoderBitRate: 16000,
      numberOfChannels: 1,
      encoderComplexity: 6,
      streamPages: false,
      mediaTrackConstraints: true,
    }) as OpusRecorderInstance;

    recorder.ondataavailable = (data: ArrayBuffer) => {
      if (data && data.byteLength > 0) this.chunks.push(data);
    };

    this.recorder = recorder;
    await recorder.start();
    this.iniciadoEn = Date.now();
    this.activo = true;
  }

  async detener(): Promise<ResultadoGrabacion> {
    const recorder = this.recorder;
    if (!recorder || !this.activo) {
      this.limpiar();
      throw new Error("No hay grabación activa");
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      let resuelto = false;
      const timeout = window.setTimeout(() => {
        if (!resuelto) {
          resuelto = true;
          reject(new Error("La grabación no finalizó a tiempo"));
        }
      }, 15_000);

      const finalizar = () => {
        if (resuelto) return;
        // Un tick por si ondataavailable llega justo después de onstop.
        window.setTimeout(() => {
          if (resuelto) return;
          resuelto = true;
          window.clearTimeout(timeout);
          resolve(new Blob(this.chunks, { type: "audio/ogg" }));
        }, 50);
      };

      recorder.ondataavailable = (data: ArrayBuffer) => {
        if (data && data.byteLength > 0) this.chunks.push(data);
      };
      recorder.onstop = finalizar;

      try {
        recorder.stop();
      } catch (e) {
        if (!resuelto) {
          resuelto = true;
          window.clearTimeout(timeout);
          reject(e instanceof Error ? e : new Error("Falló al detener la grabación"));
        }
      }
    });

    const duracionMs = Math.max(0, Date.now() - this.iniciadoEn);
    this.limpiar();

    if (duracionMs < 400 || blob.size < 200) {
      throw new Error("La nota de voz es demasiado corta");
    }

    const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    const esOgg =
      head.length >= 4 &&
      head[0] === 0x4f &&
      head[1] === 0x67 &&
      head[2] === 0x67 &&
      head[3] === 0x53;
    if (!esOgg) {
      throw new Error("El audio grabado no es OGG válido. Intenta de nuevo.");
    }

    return {
      file: new File([blob], `nota-voz-${Date.now()}.ogg`, { type: "audio/ogg" }),
      esVoz: true,
      duracionMs,
    };
  }

  cancelar(): void {
    try {
      if (this.recorder && this.activo) {
        this.recorder.ondataavailable = null;
        this.recorder.onstop = null;
        this.recorder.stop();
      }
    } catch {
      // ignore
    }
    this.limpiar();
  }

  get grabando(): boolean {
    return this.activo;
  }

  private limpiar() {
    try {
      this.recorder?.close?.();
    } catch {
      // ignore
    }
    this.recorder = null;
    this.chunks = [];
    this.activo = false;
  }
}

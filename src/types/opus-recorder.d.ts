declare module "opus-recorder" {
  export interface RecorderConfig {
    encoderPath?: string;
    encoderApplication?: number;
    encoderSampleRate?: number;
    encoderBitRate?: number;
    numberOfChannels?: number;
    encoderComplexity?: number;
    streamPages?: boolean;
    mediaTrackConstraints?: MediaStreamConstraints | boolean;
    recordingGain?: number;
    monitorGain?: number;
    bufferLength?: number;
  }

  export default class Recorder {
    constructor(config?: RecorderConfig);
    static isRecordingSupported(): boolean;
    static version: string;
    start(): Promise<void>;
    stop(): void;
    pause(flush?: boolean): void | Promise<void>;
    resume(): void;
    close(): void;
    ondataavailable: ((data: ArrayBuffer) => void) | null;
    onstop: (() => void) | null;
    onstart: (() => void) | null;
    onpause: (() => void) | null;
    onresume: (() => void) | null;
    encodedSamplePosition: number;
  }
}

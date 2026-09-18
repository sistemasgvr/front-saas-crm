"use client";

import { WebrtcSession } from "./webrtc-session";

let sharedSession: WebrtcSession | null = null;

export function getSharedCallSession(): WebrtcSession | null {
  return sharedSession;
}

export function setSharedCallSession(session: WebrtcSession | null): void {
  if (sharedSession && sharedSession !== session) {
    sharedSession.close();
  }
  sharedSession = session;
}

export function clearSharedCallSession(): void {
  sharedSession?.close();
  sharedSession = null;
}

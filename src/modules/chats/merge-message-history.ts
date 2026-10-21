import type { ConversacionDetalle } from "./types";

/** A live refresh replaces recent messages while retaining previously loaded history. */
export function mergeMessageHistory(latest: ConversacionDetalle, previous?: ConversacionDetalle): ConversacionDetalle {
  if (!previous?.mensajes.length || !latest.mensajes.length) return latest;
  const overlap = previous.mensajes.findIndex((message) => message.id === latest.mensajes[0].id);
  const older = overlap >= 0
    ? previous.mensajes.slice(0, overlap)
    : previous.mensajes.filter((message) => new Date(message.fechaMensaje).getTime() < new Date(latest.mensajes[0].fechaMensaje).getTime());
  return older.length ? {
    ...latest,
    mensajes: [...older, ...latest.mensajes],
    hayMensajesAnteriores: previous.hayMensajesAnteriores,
  } : latest;
}

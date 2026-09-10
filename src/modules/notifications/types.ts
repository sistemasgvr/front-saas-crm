export interface NotificacionItem {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  payload: Record<string, unknown> | null;
  leida: boolean;
  fechaCreacion: string;
  fechaLectura: string | null;
}

export interface ListaNotificacionesResultado {
  data: NotificacionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NotificacionEventoSocket {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  payload: Record<string, unknown> | null;
  fechaCreacion: string;
}

function rutaSegura(url: unknown): url is string {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//");
}

function rutaAgendaDesdePayload(payload: Record<string, unknown>): string {
  if (typeof payload.visitaId === "string") return `/agenda?visitaId=${payload.visitaId}`;
  if (typeof payload.actividadId === "string") {
    return `/agenda?actividadId=${payload.actividadId}`;
  }
  return "/agenda";
}

/**
 * Deep link por tipo/payload.
 * Prioridad: WhatsApp chat → agenda item → lead → Meta → url genérica.
 */
export function resolverRutaNotificacion(
  payload: Record<string, unknown> | null,
  tipo?: string | null,
): string | null {
  const conversacionId =
    payload && typeof payload.whatsappConversacionId === "string"
      ? payload.whatsappConversacionId
      : null;
  if (conversacionId) return `/chats/${conversacionId}`;
  if (tipo === "WHATSAPP_MENSAJE") return "/chats";

  if (!payload) {
    if (tipo === "AGENDA_PROXIMA") return "/agenda";
    if (tipo === "LEAD_NUEVO") return "/leads";
    return "/notifications";
  }

  if (
    tipo === "AGENDA_PROXIMA" ||
    tipo === "AGENDA_ASIGNADA" ||
    payload.origen === "VISITA" ||
    payload.origen === "ACTIVIDAD" ||
    typeof payload.visitaId === "string" ||
    typeof payload.actividadId === "string"
  ) {
    if (rutaSegura(payload.url) && payload.url.startsWith("/agenda")) {
      return payload.url;
    }
    return rutaAgendaDesdePayload(payload);
  }

  if (typeof payload.leadId === "string") return `/leads/${payload.leadId}`;
  if (typeof payload.metaPaginaId === "string") {
    return `/settings/meta/pages/${payload.metaPaginaId}`;
  }
  if (rutaSegura(payload.url)) return payload.url;
  return "/notifications";
}

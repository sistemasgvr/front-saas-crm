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

/** Deep link por tipo de notificación. */
export function resolverRutaNotificacion(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  if (typeof payload.whatsappConversacionId === "string") {
    return `/chats/${payload.whatsappConversacionId}`;
  }
  if (
    payload.origen === "VISITA" ||
    payload.origen === "ACTIVIDAD" ||
    typeof payload.visitaId === "string" ||
    typeof payload.actividadId === "string"
  ) {
    return "/agenda";
  }
  if (typeof payload.leadId === "string") return `/leads/${payload.leadId}`;
  if (typeof payload.metaPaginaId === "string") return `/settings/meta/pages/${payload.metaPaginaId}`;
  return null;
}

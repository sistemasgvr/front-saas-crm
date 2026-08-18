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

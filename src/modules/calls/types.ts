export type EstadoLlamada =
  | "RINGING"
  | "PRE_ACCEPTED"
  | "ACTIVE"
  | "ENDED"
  | "REJECTED"
  | "MISSED"
  | "FAILED";

export type ResultadoLlamada =
  | "CONTESTADA"
  | "NO_CONTESTADA"
  | "RECHAZADA"
  | "OCUPADO"
  | "FALLIDA";

export type DireccionLlamada = "ENTRANTE" | "SALIENTE";

export type RolLineaWhatsapp = "MENSAJES" | "LLAMADAS" | "AMBOS";

export type MotivoPostLlamada = "seguimiento" | "visita" | "consulta" | "otro";

/** Capacidad org — adaptado del backend (saludable ≈ disponible). */
export type CapacidadCalling = {
  disponible: boolean;
  tieneLineaCalling: boolean;
  callingHabilitado: boolean;
  conexionId?: string | null;
  phoneNumberId?: string | null;
  numeroDisplay?: string | null;
  nombreVerificado?: string | null;
  rolLinea?: string | null;
  callingUltimoError?: string | null;
  iceConfigured: boolean;
  unhealthyReason?: string | null;
};

export type CapacidadCallingApi = {
  tieneLineaCalling: boolean;
  callingHabilitado: boolean;
  conexion: {
    id: string;
    phoneNumberId: string;
    numeroDisplay: string | null;
    nombreVerificado: string | null;
    rolLinea: string;
    callingHabilitado: boolean;
    callingUltimoError: string | null;
  } | null;
  iceReady: boolean;
  saludable: boolean;
};

export type LlamadaIncomingSocket = {
  callId: string;
  id?: string;
  waId?: string | null;
  conversacionId?: string | null;
  leadId?: string | null;
  nombreContacto?: string | null;
  sdpOffer?: string | null;
  sdpType?: string;
  direccion?: string;
  inicioEn?: string;
};

export type LlamadaEndedSocket = {
  id: string;
  callId: string;
  estado: string;
  resultado?: string | null;
  duracionSeg?: number | null;
};

export type WhatsappLlamada = {
  id: string;
  organizacionId?: string;
  whatsappConexionId?: string;
  callId: string;
  waId?: string | null;
  direccion: string;
  estado: string;
  resultado?: string | null;
  inicioEn: string;
  contestadaEn?: string | null;
  finEn?: string | null;
  duracionSeg?: number | null;
  notaPostLlamada?: string | null;
  motivo?: string | null;
  conversacionId?: string | null;
  leadId?: string | null;
  asignadoUsuarioId?: string | null;
  asignadoNombre?: string | null;
  nombreContacto?: string | null;
  errorCodigo?: string | null;
  errorMensaje?: string | null;
  fechaCreacion?: string;
};

export type ListarLlamadasFiltro = {
  desde?: string;
  hasta?: string;
  asesorId?: string;
  resultado?: string;
  leadId?: string;
  conversacionId?: string;
  page?: number;
};

export type ListarLlamadasResultado = {
  items: WhatsappLlamada[];
  total: number;
  page: number;
};

/** Respuesta cruda de Meta Graph (snake_case). */
export type PermisoLlamadaApi = {
  permission?: {
    status?: string;
    expiration_time?: number;
  };
};

export type PermisoLlamada = {
  status?: string | null;
  expirationTime?: string | number | null;
  puedeLlamar?: boolean;
};

export type IceServersResponse = {
  iceServers: RTCIceServer[];
  ready: boolean;
};

export type PresenciaLlamadas = {
  disponible: boolean;
  disponibles: string[];
};

export type CallSettingsResponse = {
  conexionId: string;
  callingHabilitado: boolean;
  callingUltimoError: string | null;
  settings: {
    status?: string;
    call_icon_visibility?: string;
    call_hours?: unknown;
    callback_permission_status?: string;
  };
};

export type MetricasLlamadas = {
  contestadas: number;
  perdidas: number;
  rechazadas: number;
  duracionMediaSeg: number | null;
  total: number;
  porAsesor: Array<{
    asesorId: string;
    contestadas: number;
    total: number;
    duracionMediaSeg: number | null;
  }>;
};

export type FaseLlamadaUi =
  | "idle"
  | "ringing"
  | "connecting"
  | "active"
  | "outgoing"
  | "ended";

export const MOTIVOS_POST_LLAMADA: { value: MotivoPostLlamada; label: string }[] = [
  { value: "seguimiento", label: "Seguimiento" },
  { value: "visita", label: "Visita" },
  { value: "consulta", label: "Consulta" },
  { value: "otro", label: "Otro" },
];

export function etiquetaRolLinea(rol?: string | null): string {
  switch (rol) {
    case "LLAMADAS":
      return "Llamadas";
    case "AMBOS":
      return "Mensajes + llamadas";
    case "MENSAJES":
    default:
      return "Solo mensajes";
  }
}

export function normalizarCapacidad(api: CapacidadCallingApi): CapacidadCalling {
  const error = api.conexion?.callingUltimoError ?? null;
  let unhealthyReason: string | null = null;
  if (!api.tieneLineaCalling) unhealthyReason = "Sin línea configurada para llamadas";
  else if (!api.callingHabilitado) unhealthyReason = "Calling deshabilitado en Meta";
  else if (!api.iceReady) unhealthyReason = "ICE/TURN no configurado en el servidor";
  else if (error) unhealthyReason = error;

  return {
    disponible: api.saludable,
    tieneLineaCalling: api.tieneLineaCalling,
    callingHabilitado: api.callingHabilitado,
    conexionId: api.conexion?.id ?? null,
    phoneNumberId: api.conexion?.phoneNumberId ?? null,
    numeroDisplay: api.conexion?.numeroDisplay ?? null,
    nombreVerificado: api.conexion?.nombreVerificado ?? null,
    rolLinea: api.conexion?.rolLinea ?? null,
    callingUltimoError: error,
    iceConfigured: api.iceReady,
    unhealthyReason,
  };
}

export function normalizarPermiso(api: PermisoLlamadaApi | null | undefined): PermisoLlamada {
  const status = api?.permission?.status ?? null;
  const expirationTime = api?.permission?.expiration_time ?? null;
  const upper = status?.toUpperCase() ?? "";
  const puedeLlamar =
    upper === "GRANTED" ||
    upper === "TEMPORARY" ||
    upper === "PERMANENT" ||
    upper === "ALLOWED";
  return { status, expirationTime, puedeLlamar };
}

export function formatearDuracionSeg(seg: number | null | undefined): string {
  if (seg == null || Number.isNaN(seg)) return "—";
  const s = Math.max(0, Math.floor(seg));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function etiquetaResultado(resultado?: string | null, estado?: string | null): string {
  const r = (resultado ?? "").toUpperCase();
  if (r === "CONTESTADA") return "Contestada";
  if (r === "NO_CONTESTADA") return "Perdida";
  if (r === "RECHAZADA") return "Rechazada";
  if (r === "OCUPADO") return "Ocupado";
  if (r === "FALLIDA") return "Fallida";
  const e = (estado ?? "").toUpperCase();
  if (e === "MISSED") return "Perdida";
  if (e === "REJECTED") return "Rechazada";
  if (e === "FAILED") return "Fallida";
  if (e === "ENDED") return "Finalizada";
  if (e === "ACTIVE") return "En curso";
  if (e === "RINGING") return "Sonando";
  return resultado || estado || "—";
}

export type ModoAtencion =
  | "MANUAL"
  | "BOT_ACTIVO"
  | "ESPERANDO_HUMANO"
  | "TOMANDO_CONTROL"
  | "HUMANO_ACTIVO"
  | "PAUSADO"
  | "CERRADO";
export interface PersonaControl {
  id: string;
  nombre: string;
  apellido?: string | null;
}
export interface EstadoControl {
  modoAtencion: ModoAtencion;
  controlVersion: number;
  entradaRevision: number;
  controlUsuarioId: string | null;
  responsable: PersonaControl | null;
  controlSolicitadoEn: string | null;
  controlTomadoEn: string | null;
  controlMotivo: string | null;
  intentos: {
    id: string;
    actor: string;
    estado: "DESPACHANDO" | "ACEPTADO" | "INCIERTO";
    creadoEn: string;
    wamid: string | null;
    mensajePersistido: boolean;
  }[];
}
export interface EventoControl {
  id: string;
  version: number;
  modo: ModoAtencion;
  motivo: string;
  actor: string;
  creadoEn: string;
  usuarioId: string | null;
  responsableId: string | null;
  usuario: PersonaControl | null;
  responsable: PersonaControl | null;
}
export type ResultadoControl<T> =
  { ok: true; data: T } | { ok: false; error: string; status: number };
export class ErrorControl extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function resolverControl<T>(r: ResultadoControl<T>): T {
  if (!r.ok) throw new ErrorControl(r.error, r.status);
  return r.data;
}
export const etiquetasControl: Record<ModoAtencion, string> = {
  MANUAL: "Atención humana",
  BOT_ACTIVO: "Bot atendiendo",
  ESPERANDO_HUMANO: "Esperando asesor",
  TOMANDO_CONTROL: "Tomando control",
  HUMANO_ACTIVO: "Atención humana",
  PAUSADO: "Bot pausado",
  CERRADO: "Atención cerrada",
};
export const motivosControl: Record<string, string> = {
  toma_chat_humano: "Chat asumido por otro asesor",
  asignacion_bot_explicita: "Asignación al bot por el asesor",
  modo_inicial_empresa: "Inicio según la preferencia de la empresa",
  primer_envio_humano: "Primer mensaje del asesor",
  toma_explicita: "Toma desde el CRM",
  toma_implicita: "Primer mensaje del asesor",
  toma_confirmada: "Control humano confirmado",
  transferencia: "Transferencia de asesor",
  eco_no_atribuido:
    "Automatización pausada por un mensaje externo sin atribución",
  eco_externo: "Intervención desde WhatsApp",
};
export function nombreControl(p?: PersonaControl | null) {
  return p ? [p.nombre, p.apellido].filter(Boolean).join(" ") : "Sin asesor";
}
export function puedeOperarControl(
  estado: EstadoControl | undefined,
  usuarioId: string,
  admin: boolean,
  asignado?: string | null,
) {
  return (
    !!estado &&
    !!usuarioId &&
    (!asignado || asignado === usuarioId || admin) &&
    (!estado.controlUsuarioId ||
      estado.controlUsuarioId === usuarioId ||
      admin ||
      (!!asignado && asignado === usuarioId))
  );
}

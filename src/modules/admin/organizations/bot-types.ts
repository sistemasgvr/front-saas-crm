import type { PersonaControl } from "@/src/modules/chats/control-types";
export interface BotOrganizacion {
  organizacionId: string;
  habilitado: boolean;
  configVersion: number;
  actualizadoEn: string | null;
  actualizadoPor: string | null;
  despachosEnCurso: number;
  desactivacionPendiente: boolean;
}
export interface BotConfiguracionEvento {
  id: string;
  usuarioId: string;
  version: number;
  habilitadoAnterior: boolean;
  habilitadoNuevo: boolean;
  motivo: string;
  creadoEn: string;
  usuario?: PersonaControl | null;
}

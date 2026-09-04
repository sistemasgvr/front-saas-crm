export interface ReferenciaNombrada {
  id: string;
  nombre: string;
}

/** Resumen del catálogo CRM vinculado al lead o a una visita. */
export interface InmuebleResumenCorto {
  id: string;
  codigo: string;
  titulo: string;
}

/** Opciones de filtro con parent ids para cascada Cuenta → Campaña → Conjunto → Anuncio. */
export interface CampanaFiltroOpcion extends ReferenciaNombrada {
  metaCuentaPublicitariaId?: string | null;
}

export interface ConjuntoAnuncioFiltroOpcion extends ReferenciaNombrada {
  campanaId: string;
}

export interface AnuncioFiltroOpcion extends ReferenciaNombrada {
  conjuntoAnuncioId: string;
  campanaId?: string;
}

export const TIPOS_LEAD_INMOBILIARIA = ["COMPRA", "VENTA", "OTRO"] as const;
export type TipoLeadInmobiliaria = (typeof TIPOS_LEAD_INMOBILIARIA)[number];

export interface LeadResumen {
  id: string;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  fechaLead: string | null;
  campana: ReferenciaNombrada | null;
  anuncio: ReferenciaNombrada | null;
  tipoLead: string | null;
  asignado: ReferenciaNombrada | null;
  /** Código del pipeline — PLAN-PIPELINE-INMOBILIARIA.md. */
  estadoGestion: string;
  inmuebleInteres: InmuebleResumenCorto | null;
}

export interface LeadDetalle extends LeadResumen {
  conjuntoAnuncio: ReferenciaNombrada | null;
  formularioId: string | null;
  idExterno: string;
  datosCrudos: unknown;
  fechaCreacion: string;
  estadoGestionEn: string | null;
  motivoCierre: string | null;
  notaCierre: string | null;
  proximaAccion: ProximaAccionLead | null;
}

export interface ProximaAccionLead {
  origen: "visita" | "actividad";
  id: string;
  tipo: string;
  titulo: string;
  programadaEn: string;
  programadaFin: string;
}

// --- Pipeline (PLAN-PIPELINE-INMOBILIARIA.md) ---------------------------

export interface CampoTransicionMeta {
  codigo: string;
  etiqueta: string;
  tipo: "text" | "textarea" | "datetime" | "select";
  requerido: boolean;
  placeholder?: string;
  opciones?: { codigo: string; etiqueta: string }[];
}

export interface EstadoPipelineMeta {
  codigo: string;
  etiqueta: string;
  siguientes: readonly string[];
  camposAlEntrar: CampoTransicionMeta[];
}

export interface MotivoMeta {
  codigo: string;
  etiqueta: string;
}

export interface MetaPipeline {
  estados: EstadoPipelineMeta[];
  motivosDescarte: MotivoMeta[];
  motivosPerdido: MotivoMeta[];
  motivosGanado: MotivoMeta[];
  camposReapertura: CampoTransicionMeta[];
  /** Presente si el backend conoce override por org (v1). */
  usandoOverride?: boolean;
}

export interface LeadTableroRow {
  id: string;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  tipoLead: string | null;
  asignado: ReferenciaNombrada | null;
  estadoGestion: string;
  fechaLead: string | null;
  inmuebleInteres: InmuebleResumenCorto | null;
}

export interface ColumnaTablero {
  codigo: string;
  etiqueta: string;
  leads: LeadTableroRow[];
}

export interface TableroResultado {
  columnas: ColumnaTablero[];
}

export interface HistorialEstadoRow {
  id: string;
  tipoLead: string | null;
  desde: string | null;
  hacia: string;
  motivoCierre: string | null;
  nota: string | null;
  metadata: Record<string, string> | null;
  visita: {
    id: string;
    programadaEn: string;
    programadaFin?: string;
    duracionMinutos?: number;
    referenciaInmueble: string;
    inmuebleId?: string | null;
    inmueble?: InmuebleResumenCorto | null;
    modalidad: string;
    estado: string;
    resultado: string | null;
    nota?: string | null;
  } | null;
  calificacion: {
    id: string;
    presupuesto: string | null;
    zona: string | null;
    tipoInmueble: string | null;
    tipoPropiedad: string | null;
    precioReferencia: string | null;
    nota: string;
  } | null;
  usuario: ReferenciaNombrada | null;
  fechaCreacion: string;
}

export interface LeadVisitaRow {
  id: string;
  programadaEn: string;
  programadaFin?: string;
  duracionMinutos?: number;
  referenciaInmueble: string;
  inmuebleId?: string | null;
  inmueble?: InmuebleResumenCorto | null;
  modalidad: string;
  estado: string;
  resultado: string | null;
  nota: string | null;
  feedback: string | null;
  fechaCreacion: string;
}

export interface AgendaItemRow {
  id: string;
  origen: "visita" | "actividad";
  tipo: string;
  titulo: string;
  leadId: string;
  leadNombre: string | null;
  leadTelefono: string | null;
  programadaEn: string;
  programadaFin: string;
  duracionMinutos: number;
  referenciaInmueble: string | null;
  inmuebleId?: string | null;
  inmueble?: InmuebleResumenCorto | null;
  modalidad: string | null;
  estado: string;
  nota?: string | null;
  asignado: ReferenciaNombrada | null;
}

/** @deprecated usar AgendaItemRow */
export type VisitaAgendaRow = AgendaItemRow;

export interface CrearActividadAgendaInput {
  leadId: string;
  tipo: string;
  titulo?: string;
  programadaEn: string;
  duracionMinutos?: number;
  referenciaInmueble?: string;
  modalidad?: string;
  nota?: string;
  asignadoUsuarioId?: string;
}

export interface ActualizarActividadAgendaInput {
  tipo?: string;
  titulo?: string;
  programadaEn?: string;
  duracionMinutos?: number;
  referenciaInmueble?: string;
  modalidad?: string;
  estado?: string;
  nota?: string;
}

export interface CrearVisitaAgendaInput {
  leadId: string;
  programadaEn: string;
  duracionMinutos?: number;
  referenciaInmueble: string;
  inmuebleId?: string;
  modalidad?: string;
  nota?: string;
  asignadoUsuarioId?: string;
}

export interface ActualizarVisitaAgendaInput {
  programadaEn?: string;
  duracionMinutos?: number;
  referenciaInmueble?: string;
  modalidad?: string;
  estado?: string;
  resultado?: string;
  feedback?: string;
  nota?: string;
}

export interface GestionarLeadInput {
  tipoLead?: string;
  estadoGestion?: string;
  motivoCierre?: string;
  notaCierre?: string;
  notaTransicion?: string;
  metadata?: Record<string, string>;
  /** null quita el vínculo con el catálogo. */
  inmuebleInteresId?: string | null;
}

export interface ListaLeadsResultado {
  data: LeadResumen[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FiltroLeads {
  q?: string;
  campanaId?: string;
  anuncioId?: string;
  metaPaginaId?: string;
  metaCuentaId?: string;
  formularioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  /** "mios" | "sin_asignar" | usuarioId puntual (solo admin puede pedir el de otro). */
  asignado?: string;
  /** Código exacto, o "ABIERTOS" / "CERRADOS". */
  estadoGestion?: string;
  tipoLead?: string;
  page: number;
}

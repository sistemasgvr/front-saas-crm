export interface ReferenciaNombrada {
  id: string;
  nombre: string;
}

export interface LeadResumen {
  id: string;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  fechaLead: string | null;
  campana: ReferenciaNombrada | null;
  anuncio: ReferenciaNombrada | null;
}

export interface LeadDetalle extends LeadResumen {
  conjuntoAnuncio: ReferenciaNombrada | null;
  formularioId: string | null;
  idExterno: string;
  datosCrudos: unknown;
  fechaCreacion: string;
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
  formularioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page: number;
}

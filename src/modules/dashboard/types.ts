export interface DashboardKpis {
  total: number;
  hoy: number;
  semana: number;
  mes: number;
}

export interface PuntoSerieDia {
  fecha: string;
  total: number;
}

export interface PuntoSerieNombrado {
  id: string;
  nombre: string;
  total: number;
}

export interface DashboardSeries {
  porDia: PuntoSerieDia[];
  porCampana: PuntoSerieNombrado[];
  porAnuncio: PuntoSerieNombrado[];
}

export interface FiltroDashboard {
  campanaId?: string;
  conjuntoAnuncioId?: string;
  anuncioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

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
  metaCuentaId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface KpisPublicitarios {
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  cpc: number | null;
  cpl: number | null;
  leads: number;
  moneda: string | null;
}

export interface PuntoSpendDia {
  fecha: string;
  spend: number;
}

export interface SerieSpendCuenta {
  id: string;
  nombre: string;
  porDia: PuntoSpendDia[];
}

export interface SeriesPublicitarias {
  porDia: PuntoSpendDia[];
  porCuenta?: SerieSpendCuenta[];
}

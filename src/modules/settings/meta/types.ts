export type MetaConnection =
  | { appConfigurada: false; conectado: false }
  | {
      appConfigurada: true;
      appId: string | null;
      conectado: boolean;
      id: string;
      metaUserNombre: string | null;
      paginasActivas: number;
      cuentasActivas: number;
      tokenExpiraEn: string | null;
      fechaCreacion: string;
    };

export type MetaConnectionConfigured = Extract<MetaConnection, { appConfigurada: true }>;

export function isMetaConnectionConfigured(
  connection: MetaConnection | undefined,
): connection is MetaConnectionConfigured {
  return connection !== undefined && connection.appConfigurada;
}

/** Opción {id, nombre} — usada por dropdowns de filtro que leen directo de Graph (no del hub). */
export interface MetaOption {
  id: string;
  nombre: string;
}

export interface MetaPagina {
  id: string;
  organizacionId: string;
  metaConexionId: string;
  pageId: string;
  nombre: string;
  webhookSuscrito: boolean;
  webhookSuscritoEn: string | null;
  fotoUrl: string | null;
  categoria: string | null;
  fechaCreacion: string;
}

export interface MetaPaginaPerfil extends MetaPagina {
  totalLeads: number;
  leadsUltimos7Dias: number;
}

export interface ListaMetaPaginasResultado {
  data: MetaPagina[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MetaCuentaPublicitaria {
  id: string;
  organizacionId: string;
  metaConexionId: string;
  adAccountId: string;
  nombre: string;
  moneda: string | null;
  estadoCuenta: string | null;
  timezone: string | null;
  ultimoSyncEn: string | null;
  fechaCreacion: string;
}

export interface CampanaResumen {
  id: string;
  nombre: string;
  estadoMeta: string | null;
  totalLeads: number;
}

export interface MetaCuentaPublicitariaPerfil extends MetaCuentaPublicitaria {
  totalCampanas: number;
  totalLeads: number;
  ultimasCampanas: CampanaResumen[];
}

export interface ListaMetaCuentasResultado {
  data: MetaCuentaPublicitaria[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

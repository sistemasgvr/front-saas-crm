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
  webhookUltimoCheckEn: string | null;
  webhookUltimoError: string | null;
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
  spend: number;
  cpl: number | null;
}

export interface FeaturePermisoEstado {
  id: string;
  label: string;
  tipo: "nucleo" | "optin";
  deseada: boolean;
  estado: "ok" | "falta";
  scopesRequeridos: string[];
  scopesFaltantes: string[];
  puedeDesactivar: boolean;
}

export interface SaludPermisosMeta {
  isValid: boolean;
  scopesOtorgados: string[];
  features: FeaturePermisoEstado[];
  tieneFaltantesDeseados: boolean;
  notaAdvancedAccess: string;
}

export interface ResultadoSyncInsights {
  filasCuenta: number;
  filasCampana: number;
  errores: number;
  moneda: string | null;
}

export interface ListaMetaCuentasResultado {
  data: MetaCuentaPublicitaria[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MetaFormulario {
  id: string;
  organizacionId: string;
  metaPaginaId: string;
  formId: string;
  nombre: string;
  estadoMeta: string | null;
  locale: string | null;
  ultimoSyncEn: string | null;
  fechaCreacion: string;
  totalLeads: number;
}

export interface ResultadoSyncFormularios {
  sincronizados: number;
  total: number;
}

export interface ResultadoBackfill {
  importados: number;
  yaExistian: number;
  errores: number;
  incompleto: boolean;
  nextCursor?: string;
}

export type TipoInmueble =
  | "DEPARTAMENTO"
  | "CASA"
  | "TERRENO"
  | "LOCAL"
  | "OFICINA"
  | "OTRO";

export type OperacionInmueble = "VENTA" | "ALQUILER";

export type EstadoInmuebleCatalogo =
  | "DISPONIBLE"
  | "RESERVADO"
  | "VENDIDO"
  | "INACTIVO";

export interface InmuebleRow {
  id: string;
  codigo: string;
  titulo: string;
  tipo: string;
  operacion: string;
  zona: string | null;
  direccion: string | null;
  precio: number | null;
  moneda: string;
  estadoInmueble: string;
  notas: string | null;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface InmuebleFiltroOption {
  id: string;
  codigo: string;
  titulo: string;
  operacion: string;
  estadoInmueble: string;
  zona: string | null;
}

export type OrigenInteresInmueble = "interes" | "visita" | "ambos";

/** Lead rankeado por probabilidad de adquirir este inmueble (GET /inmuebles/:id/interesados). */
export interface InmuebleInteresadoRankeado {
  id: string;
  nombre: string;
  telefono: string | null;
  estadoGestion: string;
  etiquetaEstado: string;
  tipoLead: string | null;
  score: number;
  motivoRanking?: string[];
  origen: OrigenInteresInmueble;
}

export interface ListaInmueblesResultado {
  data: InmuebleRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FiltroInmuebles {
  page?: number;
  pageSize?: number;
  q?: string;
  tipo?: string;
  operacion?: string;
  estadoInmueble?: string;
  zona?: string;
}

export const TIPOS_INMUEBLE_OPTIONS = [
  { value: "DEPARTAMENTO", label: "Departamento" },
  { value: "CASA", label: "Casa" },
  { value: "TERRENO", label: "Terreno" },
  { value: "LOCAL", label: "Local" },
  { value: "OFICINA", label: "Oficina" },
  { value: "OTRO", label: "Otro" },
] as const;

export const OPERACIONES_INMUEBLE_OPTIONS = [
  { value: "VENTA", label: "Venta" },
  { value: "ALQUILER", label: "Alquiler" },
] as const;

export const ESTADOS_INMUEBLE_OPTIONS = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "RESERVADO", label: "Reservado" },
  { value: "VENDIDO", label: "Vendido" },
  { value: "INACTIVO", label: "Inactivo" },
] as const;

export function etiquetaTipoInmueble(codigo: string) {
  return TIPOS_INMUEBLE_OPTIONS.find((o) => o.value === codigo)?.label ?? codigo;
}

export function etiquetaOperacionInmueble(codigo: string) {
  return OPERACIONES_INMUEBLE_OPTIONS.find((o) => o.value === codigo)?.label ?? codigo;
}

export function etiquetaEstadoInmueble(codigo: string) {
  return ESTADOS_INMUEBLE_OPTIONS.find((o) => o.value === codigo)?.label ?? codigo;
}

export function etiquetaInmuebleFiltro(opt: InmuebleFiltroOption) {
  const zona = opt.zona ? ` · ${opt.zona}` : "";
  return `${opt.codigo} — ${opt.titulo}${zona}`;
}

export function formatearPrecioInmueble(
  precio: number | null,
  moneda: string,
): string {
  if (precio === null || precio === undefined) return "—";
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: moneda || "PEN",
      maximumFractionDigits: 0,
    }).format(precio);
  } catch {
    return `${moneda} ${precio}`;
  }
}

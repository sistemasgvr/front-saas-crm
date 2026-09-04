import type { CampoTransicionMeta } from "./types";

/** Etiquetas para metadata del historial (espejo del dominio backend). */
const ETIQUETAS_METADATA: Record<string, string> = {
  canalContacto: "Canal",
  presupuesto: "Presupuesto",
  zona: "Zona",
  tipoInmueble: "Tipo de inmueble",
  visitaProgramadaEn: "Visita programada",
  duracionMinutos: "Duración",
  referenciaInmueble: "Inmueble",
  modalidadVisita: "Modalidad",
  resultadoVisita: "Resultado",
  tipoPropiedad: "Tipo de propiedad",
  precioReferencia: "Precio esperado",
  direccion: "Dirección",
  precioPedido: "Precio pedido",
  montoReferencia: "Monto",
};

const ETIQUETAS_SELECT: Record<string, Record<string, string>> = {
  canalContacto: {
    WHATSAPP: "WhatsApp",
    LLAMADA: "Llamada",
    EMAIL: "Correo",
    PRESENCIAL: "Presencial",
    OTRO: "Otro",
  },
  modalidadVisita: {
    PRESENCIAL: "Presencial",
    VIRTUAL: "Virtual / videollamada",
  },
  resultadoVisita: {
    ASISTIO: "Asistió",
    NO_SHOW: "No se presentó",
    CANCELADA: "Cancelada",
  },
  duracionMinutos: {
    "30": "30 minutos",
    "60": "60 minutos",
    "90": "90 minutos",
    "120": "2 horas",
    "180": "3 horas",
  },
};

export function etiquetaMetadata(codigo: string): string {
  return ETIQUETAS_METADATA[codigo] ?? codigo;
}

export function formatearValorMetadata(codigo: string, valor: string): string {
  if (codigo === "visitaProgramadaEn") {
    try {
      return new Date(valor).toLocaleString("es-PE", {
        timeZone: "America/Lima",
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return valor;
    }
  }
  if (codigo === "duracionMinutos") {
    return ETIQUETAS_SELECT.duracionMinutos?.[valor] ?? `${valor} min`;
  }
  return ETIQUETAS_SELECT[codigo]?.[valor] ?? valor;
}

/** Valores iniciales del modal de transición (p. ej. duración por defecto 60). */
export function valoresInicialesTransicion(
  campos: CampoTransicionMeta[],
): Record<string, string> {
  const iniciales: Record<string, string> = {};
  for (const campo of campos) {
    if (campo.codigo === "duracionMinutos") {
      iniciales[campo.codigo] = "60";
    }
  }
  return iniciales;
}

export function camposParaDestino(
  meta: { estados: { codigo: string; camposAlEntrar: CampoTransicionMeta[] }[]; camposReapertura?: CampoTransicionMeta[] },
  destino: string,
  esReapertura = false,
): CampoTransicionMeta[] {
  if (esReapertura) return meta.camposReapertura ?? [];
  return meta.estados.find((e) => e.codigo === destino)?.camposAlEntrar ?? [];
}

/** Convierte datetime-local (sin Z) a ISO para el backend. */
export function datetimeLocalAISO(valor: string): string {
  if (!valor) return valor;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toISOString();
}

export function formularioTransicionValido(
  campos: CampoTransicionMeta[],
  valores: Record<string, string>,
): boolean {
  return campos.every((campo) => {
    if (!campo.requerido) return true;
    const v = valores[campo.codigo]?.trim();
    return Boolean(v);
  });
}

export function construirPayloadTransicion(
  campos: CampoTransicionMeta[],
  valores: Record<string, string>,
): { notaTransicion?: string; metadata?: Record<string, string> } {
  const metadata: Record<string, string> = {};
  let notaTransicion: string | undefined;

  for (const campo of campos) {
    const raw = valores[campo.codigo]?.trim();
    if (!raw) continue;
    if (campo.codigo === "notaTransicion") {
      notaTransicion = raw;
    } else if (campo.tipo === "datetime") {
      metadata[campo.codigo] = datetimeLocalAISO(raw);
    } else {
      metadata[campo.codigo] = raw;
    }
  }

  // FK opcional del catálogo (no es un campo declarado del pipeline).
  const inmuebleId = valores.inmuebleId?.trim();
  if (inmuebleId) {
    metadata.inmuebleId = inmuebleId;
  }

  return {
    notaTransicion,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

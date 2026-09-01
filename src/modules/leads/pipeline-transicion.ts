import type { CampoTransicionMeta } from "./types";

/** Etiquetas para metadata del historial (espejo del dominio backend). */
const ETIQUETAS_METADATA: Record<string, string> = {
  canalContacto: "Canal",
  presupuesto: "Presupuesto",
  zona: "Zona",
  tipoInmueble: "Tipo de inmueble",
  visitaProgramadaEn: "Visita programada",
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
  return ETIQUETAS_SELECT[codigo]?.[valor] ?? valor;
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

  return {
    notaTransicion,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

/**
 * Copy y colores del pipeline — espejo liviano de
 * back-saas-crm/src/shared/domain/pipeline-inmobiliaria.ts, solo para no
 * pedir /leads/pipeline/meta en la lista de leads (sería una llamada extra
 * por cada tipoLead distinto en pantalla). El detalle de un lead sí pide el
 * catálogo real al backend, porque ahí necesita las transiciones válidas,
 * no solo la etiqueta.
 */

export const ESTADOS_TERMINALES = ['CERRADO_GANADO', 'CERRADO_PERDIDO', 'DESCARTADO'] as const;

const ETIQUETAS_COMPRA: Record<string, string> = {
  NUEVO: 'Nuevo',
  CONTACTADO: 'Contactado',
  CALIFICADO: 'Calificado',
  VISITA_AGENDADA: 'Visita agendada',
  VISITA_REALIZADA: 'Visita realizada',
  NEGOCIACION: 'Negociación',
  SEPARACION: 'Separación / reserva',
  CERRADO_GANADO: 'Cerrado ganado',
  CERRADO_PERDIDO: 'Cerrado perdido',
  DESCARTADO: 'Descartado',
};

const ETIQUETAS_VENTA: Record<string, string> = {
  NUEVO: 'Nuevo',
  CONTACTADO: 'Contactado',
  CALIFICADO: 'Calificado',
  CAPTACION: 'Captación',
  EN_COMERCIALIZACION: 'En comercialización',
  NEGOCIACION: 'Negociación',
  SEPARACION: 'Separación / reserva',
  CERRADO_GANADO: 'Cerrado ganado',
  CERRADO_PERDIDO: 'Cerrado perdido',
  DESCARTADO: 'Descartado',
};

const ETIQUETAS_OTRO: Record<string, string> = {
  NUEVO: 'Nuevo',
  CONTACTADO: 'Contactado',
  CALIFICADO: 'Calificado',
  CERRADO_GANADO: 'Cerrado ganado',
  CERRADO_PERDIDO: 'Cerrado perdido',
  DESCARTADO: 'Descartado',
};

export const ETIQUETA_TIPO_LEAD: Record<string, string> = {
  COMPRA: 'Compra',
  VENTA: 'Venta',
  OTRO: 'Otro',
};

export function etiquetaEstadoGestion(tipoLead: string | null | undefined, estado: string): string {
  const mapa = tipoLead === 'COMPRA' ? ETIQUETAS_COMPRA : tipoLead === 'VENTA' ? ETIQUETAS_VENTA : ETIQUETAS_OTRO;
  return mapa[estado] ?? estado;
}

/**
 * Un color por estado, no 3 baldes genéricos — así se distingue de un
 * vistazo en qué etapa exacta está cada lead, no solo "abierto/cerrado".
 * VISITA_AGENDADA comparte color con CAPTACION (y VISITA_REALIZADA con
 * EN_COMERCIALIZACION) porque son la misma posición del embudo en Compra vs
 * Venta — nunca aparecen juntos para un mismo lead, así que no hay
 * ambigüedad real. Clases completas (no armadas por interpolación) para que
 * Tailwind las detecte al escanear el código.
 */
const CLASE_POR_ESTADO: Record<string, string> = {
  NUEVO: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80',
  CONTACTADO: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  CALIFICADO: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400',
  VISITA_AGENDADA: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  CAPTACION: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  VISITA_REALIZADA: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  EN_COMERCIALIZACION: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  NEGOCIACION: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400',
  SEPARACION: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  CERRADO_GANADO: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  CERRADO_PERDIDO: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
  DESCARTADO: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

/** Clase completa de fondo+texto para un pill de estado — usar con
 * <EstadoPipelineBadge>, no con el Badge genérico (que solo tiene 7 colores
 * fijos, no alcanzan para 12 estados distintos). */
export function claseEstadoGestion(estado: string): string {
  return CLASE_POR_ESTADO[estado] ?? CLASE_POR_ESTADO.NUEVO;
}

/** Mismo criterio de color que CLASE_POR_ESTADO, pero como punto sólido
 * (bg-*-500) — el tono claro (bg-*-50) del badge se ve casi invisible como
 * indicador chico en el encabezado de una columna del tablero. */
const PUNTO_POR_ESTADO: Record<string, string> = {
  NUEVO: 'bg-gray-400',
  CONTACTADO: 'bg-sky-500',
  CALIFICADO: 'bg-brand-500',
  VISITA_AGENDADA: 'bg-cyan-500',
  CAPTACION: 'bg-cyan-500',
  VISITA_REALIZADA: 'bg-teal-500',
  EN_COMERCIALIZACION: 'bg-teal-500',
  NEGOCIACION: 'bg-warning-500',
  SEPARACION: 'bg-purple-500',
  CERRADO_GANADO: 'bg-success-500',
  CERRADO_PERDIDO: 'bg-error-500',
  DESCARTADO: 'bg-rose-500',
};

/** Clase de punto sólido para el encabezado de una columna del tablero kanban. */
export function puntoEstadoGestion(estado: string): string {
  return PUNTO_POR_ESTADO[estado] ?? PUNTO_POR_ESTADO.NUEVO;
}

export function esEstadoTerminal(estado: string): boolean {
  return (ESTADOS_TERMINALES as readonly string[]).includes(estado);
}

/** Solo en Nuevo/Contactado se puede reclasificar sin reiniciar el embudo. */
export function puedeCambiarTipoLead(estadoGestion: string): boolean {
  return estadoGestion === 'NUEVO' || estadoGestion === 'CONTACTADO';
}

export function cambioTipoReiniciaEmbudo(estadoGestion: string): boolean {
  return !puedeCambiarTipoLead(estadoGestion) && !esEstadoTerminal(estadoGestion);
}

export function tipoLeadClasificado(tipoLead: string | null | undefined): boolean {
  return tipoLead === 'COMPRA' || tipoLead === 'VENTA' || tipoLead === 'OTRO';
}

/**
 * Antes solo pedía clasificar en NUEVO — un lead que ya avanzó a Contactado
 * (u otro estado donde puedeCambiarTipoLead sigue siendo true) sin tipo
 * definido no mostraba ningún aviso, y al intentar arrastrarlo más lejos
 * tiraba un error genérico de "transición inválida" en vez de explicar qué
 * falta. Ahora pide clasificar en cualquier estado no terminal mientras
 * siga sin tipoLead, sea NUEVO o CONTACTADO. */
export function requiereClasificarTipo(lead: {
  estadoGestion: string;
  tipoLead: string | null | undefined;
}): boolean {
  return !esEstadoTerminal(lead.estadoGestion) && !tipoLeadClasificado(lead.tipoLead);
}

export function esTransicionPermitidaEnMeta(
  meta: { estados: { codigo: string; siguientes: readonly string[] }[] },
  estadoActual: string,
  destino: string,
): boolean {
  const estado = meta.estados.find((e) => e.codigo === estadoActual);
  return estado?.siguientes.includes(destino) ?? false;
}

/** Icono MDI por etapa — da identidad visual al embudo inmobiliario. */
const ICONO_POR_ESTADO: Record<string, string> = {
  NUEVO: 'mdi:inbox-arrow-down-outline',
  CONTACTADO: 'mdi:phone-outline',
  CALIFICADO: 'mdi:account-check-outline',
  VISITA_AGENDADA: 'mdi:calendar-clock-outline',
  VISITA_REALIZADA: 'mdi:home-search-outline',
  CAPTACION: 'mdi:home-plus-outline',
  EN_COMERCIALIZACION: 'mdi:home-city-outline',
  NEGOCIACION: 'mdi:handshake-outline',
  SEPARACION: 'mdi:key-outline',
  CERRADO_GANADO: 'mdi:trophy-outline',
  CERRADO_PERDIDO: 'mdi:emoticon-sad-outline',
  DESCARTADO: 'mdi:archive-off-outline',
};

export function iconoEstadoGestion(estado: string): string {
  return ICONO_POR_ESTADO[estado] ?? 'mdi:circle-outline';
}

/** Porcentaje de avance en el embudo (solo estados no terminales). */
export function progresoEmbudo(
  estadosNoTerminales: readonly string[],
  estadoActual: string,
): { indice: number; total: number; porcentaje: number } {
  const indice = estadosNoTerminales.findIndex((e) => e === estadoActual);
  const total = estadosNoTerminales.length;
  if (indice < 0 || total === 0) return { indice: 0, total, porcentaje: 0 };
  return {
    indice,
    total,
    porcentaje: Math.round(((indice + 1) / total) * 100),
  };
}

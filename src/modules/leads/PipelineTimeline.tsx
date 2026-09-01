"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Icon } from "@/src/components/ui/Icon";
import EstadoPipelineBadge from "./EstadoPipelineBadge";
import { puntoEstadoGestion } from "./pipeline";
import { etiquetaMetadata, formatearValorMetadata } from "./pipeline-transicion";
import type { HistorialEstadoRow } from "./types";

function formatearFechaCompleta(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatearRelativo(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
  } catch {
    return formatearFechaCompleta(iso);
  }
}

/** Línea de tiempo del historial de un lead — un punto de color por fila
 * (mismo color que el estado destino en el badge/tablero) sobre una línea
 * vertical continua, con las etiquetas reales del pipeline en vez de texto
 * plano "Contactado → Calificado". */
export default function PipelineTimeline({ filas }: { filas: HistorialEstadoRow[] }) {
  const ordenDesc = [...filas].reverse();

  return (
    <div className="relative pl-1">
      <div className="absolute top-1 bottom-1 left-[15px] w-px bg-gray-200 dark:bg-gray-800" />
      <ul className="space-y-3">
        {ordenDesc.map((fila) => (
          <li key={fila.id} className="relative flex gap-3">
            <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-4 ring-white dark:bg-gray-900 dark:ring-gray-900">
              {fila.desde ? (
                <span className={`h-2.5 w-2.5 rounded-full ${puntoEstadoGestion(fila.hacia)}`} />
              ) : (
                <Icon name="mdi:star-four-points-outline" size={15} className="text-brand-500" />
              )}
            </span>
            <div className="min-w-0 flex-1 pb-0.5">
              {fila.desde ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <EstadoPipelineBadge tipoLead={fila.tipoLead} estado={fila.desde} />
                  <Icon name="mdi:arrow-right" size={14} className="text-gray-300 dark:text-gray-600" />
                  <EstadoPipelineBadge tipoLead={fila.tipoLead} estado={fila.hacia} />
                </div>
              ) : (
                <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-200">Lead creado</p>
              )}
              {fila.motivoCierre && (
                <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                  Motivo: <span className="font-medium text-gray-600 dark:text-gray-300">{fila.motivoCierre}</span>
                </p>
              )}
              {fila.nota && (
                <p className="mt-0.5 text-theme-xs italic text-gray-400 dark:text-gray-500">“{fila.nota}”</p>
              )}
              {fila.metadata && Object.keys(fila.metadata).length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {Object.entries(fila.metadata).map(([clave, valor]) => (
                    <li key={clave} className="text-theme-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {etiquetaMetadata(clave)}:
                      </span>{" "}
                      {formatearValorMetadata(clave, valor)}
                    </li>
                  ))}
                </ul>
              )}
              {fila.visita && (
                <div className="mt-1.5 rounded-lg bg-brand-50/50 px-2.5 py-2 text-theme-xs text-gray-600 dark:bg-brand-500/5 dark:text-gray-300">
                  <span className="font-medium">Visita:</span>{" "}
                  {new Date(fila.visita.programadaEn).toLocaleString("es-PE", {
                    timeZone: "America/Lima",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  — {fila.visita.referenciaInmueble}
                </div>
              )}
              {fila.calificacion && (
                <div className="mt-1.5 rounded-lg bg-gray-50 px-2.5 py-2 text-theme-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
                  {fila.calificacion.zona && <p>Zona: {fila.calificacion.zona}</p>}
                  {fila.calificacion.presupuesto && <p>Presupuesto: {fila.calificacion.presupuesto}</p>}
                  {fila.calificacion.tipoPropiedad && <p>Tipo: {fila.calificacion.tipoPropiedad}</p>}
                </div>
              )}
              <p className="mt-1 text-theme-xs text-gray-400">
                {fila.usuario?.nombre ?? "Sistema"} ·{" "}
                <span title={formatearFechaCompleta(fila.fechaCreacion)}>{formatearRelativo(fila.fechaCreacion)}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

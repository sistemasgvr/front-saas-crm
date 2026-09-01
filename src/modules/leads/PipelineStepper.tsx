"use client";

import { Icon } from "@/src/components/ui/Icon";
import { iconoEstadoGestion, progresoEmbudo } from "./pipeline";

interface EstadoPipelineMeta {
  codigo: string;
  etiqueta: string;
  siguientes: readonly string[];
}

/**
 * Embudo compacto: barra segmentada + iconos (sin 7 etiquetas apretadas).
 * En móvil permite scroll horizontal suave si hay muchas etapas.
 */
export default function PipelineStepper({
  estados,
  estadoActual,
  siguientes,
  disabled,
  onSelect,
}: {
  estados: EstadoPipelineMeta[];
  estadoActual: string;
  siguientes: readonly string[];
  disabled: boolean;
  onSelect: (codigo: string) => void;
}) {
  const codigos = estados.map((estado) => estado.codigo);
  const { indice, total, porcentaje } = progresoEmbudo(codigos, estadoActual);
  const etiquetaActual = estados[indice]?.etiqueta ?? estadoActual;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <span className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
          Progreso del embudo
        </span>
        <span className="text-theme-xs tabular-nums text-gray-400">
          Etapa {indice + 1}/{total} · {porcentaje}%
        </span>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="min-w-[17.5rem] space-y-2 sm:min-w-0">
          {/* Barra segmentada */}
          <div className="flex gap-0.5 sm:gap-1">
            {estados.map((estado, i) => {
              const esCompletado = indice >= 0 && i < indice;
              const esActual = i === indice;
              return (
                <div
                  key={`bar-${estado.codigo}`}
                  className={`h-1.5 min-w-[1.25rem] flex-1 rounded-full transition-colors duration-300 ${
                    esCompletado
                      ? "bg-brand-500"
                      : esActual
                        ? "bg-brand-300 dark:bg-brand-400"
                        : "bg-gray-200 dark:bg-gray-700"
                  }`}
                  title={estado.etiqueta}
                />
              );
            })}
          </div>

          {/* Iconos */}
          <div className="flex gap-0.5 sm:gap-1">
            {estados.map((estado, i) => {
              const esCompletado = indice >= 0 && i < indice;
              const esActual = i === indice;
              const esClickeable = !disabled && siguientes.includes(estado.codigo);
              const icono = iconoEstadoGestion(estado.codigo);

              return (
                <button
                  key={estado.codigo}
                  type="button"
                  disabled={!esClickeable}
                  onClick={() => onSelect(estado.codigo)}
                  title={esClickeable ? `Mover a ${estado.etiqueta}` : estado.etiqueta}
                  className={`group flex min-w-[2.25rem] flex-1 flex-col items-center gap-1 rounded-lg py-1 transition sm:min-w-0 ${
                    esClickeable
                      ? "cursor-pointer hover:bg-brand-50/80 dark:hover:bg-brand-500/5"
                      : "cursor-default"
                  } ${esActual ? "bg-brand-50/60 dark:bg-brand-500/10" : ""}`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all sm:h-8 sm:w-8 ${
                      esActual
                        ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                        : esCompletado
                          ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                          : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    {esCompletado ? (
                      <Icon name="mdi:check" size={14} />
                    ) : (
                      <Icon name={icono} size={15} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-center text-theme-sm font-medium text-gray-800 dark:text-white/90">
        {etiquetaActual}
      </p>
    </div>
  );
}

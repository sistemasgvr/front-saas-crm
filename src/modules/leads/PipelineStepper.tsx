"use client";

import { Icon } from "@/src/components/ui/Icon";

interface EstadoPipelineMeta {
  codigo: string;
  etiqueta: string;
  siguientes: readonly string[];
}

/**
 * Barra de pasos horizontal del pipeline — mismo patrón que "Salesforce
 * Path" / el stage-tracker de HubSpot: toda la ruta a la vista de una,
 * completados marcados, el actual resaltado, los que faltan atenuados. Solo
 * recibe los estados NO terminales (el cierre — ganado/perdido/descartado —
 * se muestra aparte, no compite por espacio en la barra).
 *
 * Un paso es clickeable si está en `siguientes` del estado actual (venga
 * antes o después en la barra — hay transiciones válidas "hacia atrás",
 * ej. Separación → Negociación). No se puede saltar pasos que no están en
 * `siguientes`: la barra es solo el mapa, la validación real sigue siendo
 * la matriz de transiciones del backend.
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
  const indiceActual = estados.findIndex((e) => e.codigo === estadoActual);

  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-max items-center">
        {estados.map((estado, i) => {
          const esCompletado = indiceActual >= 0 && i < indiceActual;
          const esActual = i === indiceActual;
          const esClickeable = !disabled && siguientes.includes(estado.codigo);

          return (
            <li key={estado.codigo} className="flex items-center">
              {i > 0 && (
                <span
                  className={`h-0.5 w-6 shrink-0 sm:w-10 ${
                    esCompletado || esActual
                      ? "bg-brand-400 dark:bg-brand-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
              <button
                type="button"
                disabled={!esClickeable}
                onClick={() => onSelect(estado.codigo)}
                title={esClickeable ? `Mover a ${estado.etiqueta}` : estado.etiqueta}
                className={`group flex flex-col items-center gap-1.5 rounded-lg px-1.5 py-1 ${
                  esClickeable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-theme-xs font-semibold transition ${
                    esActual
                      ? "bg-brand-500 text-white ring-4 ring-brand-500/20"
                      : esCompletado
                        ? "bg-brand-500 text-white"
                        : "bg-white text-gray-400 ring-1 ring-inset ring-gray-300 dark:bg-gray-900 dark:text-gray-500 dark:ring-gray-700"
                  } ${esClickeable ? "group-hover:ring-2 group-hover:ring-brand-400" : ""}`}
                >
                  {esCompletado ? <Icon name="mdi:check" size={15} /> : i + 1}
                </span>
                <span
                  className={`max-w-[5.5rem] whitespace-nowrap text-theme-xs ${
                    esActual
                      ? "font-semibold text-brand-500"
                      : esCompletado
                        ? "font-medium text-gray-700 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-500"
                  } ${esClickeable && !esActual ? "group-hover:text-brand-500" : ""}`}
                >
                  {estado.etiqueta}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import Select from "@/src/components/form/Select";
import TextArea from "@/src/components/form/input/TextArea";
import { Icon } from "@/src/components/ui/Icon";
import { QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { gestionarLeadAction } from "./actions";
import { getHistorialLead, getMetaPipeline } from "./queries";
import PipelineStepper from "./PipelineStepper";
import PipelineTimeline from "./PipelineTimeline";
import { esEstadoTerminal, ETIQUETA_TIPO_LEAD, etiquetaEstadoGestion } from "./pipeline";
import { TIPOS_LEAD_INMOBILIARIA } from "./types";

const ESTADOS_REAPERTURA = ["CONTACTADO", "CALIFICADO"];

/** Look por resultado de cierre — usado en el banner final del pipeline. */
const RESULTADO_CIERRE: Record<string, { icon: string; clase: string }> = {
  CERRADO_GANADO: {
    icon: "mdi:trophy-outline",
    clase: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  },
  CERRADO_PERDIDO: {
    icon: "mdi:close-circle-outline",
    clase: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
  },
  DESCARTADO: {
    icon: "mdi:cancel",
    clase: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  },
};

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

export default function LeadPipelinePanel({
  leadId,
  tipoLead,
  estadoGestion,
  estadoGestionEn,
  motivoCierre,
  notaCierre,
  esAdmin,
  puedeGestionar,
}: {
  leadId: string;
  tipoLead: string | null;
  estadoGestion: string;
  estadoGestionEn: string | null;
  motivoCierre: string | null;
  notaCierre: string | null;
  esAdmin: boolean;
  puedeGestionar: boolean;
}) {
  const [destinoCierre, setDestinoCierre] = useState<string | null>(null);
  const [motivoForm, setMotivoForm] = useState("");
  const [notaForm, setNotaForm] = useState("");
  const [reabrirAbierto, setReabrirAbierto] = useState(false);

  const metaQuery = useQuery({
    queryKey: queryKeys.leadPipelineMeta(tipoLead),
    queryFn: () => getMetaPipeline(tipoLead),
  });
  const historialQuery = useQuery({
    queryKey: queryKeys.leadHistorial(leadId),
    queryFn: () => getHistorialLead(leadId),
  });

  const gestionar = useAppMutation({
    mutationFn: (input: Parameters<typeof gestionarLeadAction>[1]) => gestionarLeadAction(leadId, input),
    successMessage: "Gestión actualizada",
    invalidateKeys: [queryKeys.lead(leadId), queryKeys.leadsAll, queryKeys.leadHistorial(leadId)],
  });

  const estadoActualMeta = metaQuery.data?.estados.find((e) => e.codigo === estadoGestion);
  const siguientes = estadoActualMeta?.siguientes ?? [];
  const terminal = esEstadoTerminal(estadoGestion);
  const estadosNoTerminales = metaQuery.data?.estados.filter((e) => !esEstadoTerminal(e.codigo)) ?? [];

  const motivosParaDestino = (destino: string | null) => {
    if (!metaQuery.data || !destino) return [];
    if (destino === "DESCARTADO") return metaQuery.data.motivosDescarte;
    if (destino === "CERRADO_PERDIDO") return metaQuery.data.motivosPerdido;
    if (destino === "CERRADO_GANADO") return metaQuery.data.motivosGanado;
    return [];
  };

  const iniciarCambio = (destino: string) => {
    if (esEstadoTerminal(destino)) {
      setDestinoCierre(destino);
      setMotivoForm("");
      setNotaForm("");
    } else {
      gestionar.mutate({ estadoGestion: destino });
    }
  };

  const confirmarCierre = () => {
    if (!destinoCierre || !motivoForm) return;
    gestionar.mutate(
      { estadoGestion: destinoCierre, motivoCierre: motivoForm, notaCierre: notaForm || undefined },
      { onSuccess: () => setDestinoCierre(null) },
    );
  };

  const resultado = RESULTADO_CIERRE[estadoGestion];

  return (
    <div className="space-y-4">
      {/* Tipo de lead */}
      {puedeGestionar ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-theme-sm text-gray-500 dark:text-gray-400">Tipo de lead:</span>
          {TIPOS_LEAD_INMOBILIARIA.map((tipo) => (
            <button
              key={tipo}
              type="button"
              disabled={gestionar.isPending}
              onClick={() => gestionar.mutate({ tipoLead: tipo })}
              className={`rounded-full px-3 py-1 text-theme-xs font-medium transition ${
                tipoLead === tipo
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {ETIQUETA_TIPO_LEAD[tipo] ?? tipo}
            </button>
          ))}
        </div>
      ) : (
        tipoLead && (
          <div className="flex items-center gap-2">
            <span className="text-theme-sm text-gray-500 dark:text-gray-400">Tipo:</span>
            <Badge size="sm" color="light">
              {ETIQUETA_TIPO_LEAD[tipoLead] ?? tipoLead}
            </Badge>
          </div>
        )
      )}

      {/* Estado del pipeline */}
      <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
        {metaQuery.isError && <QueryError error={metaQuery.error} />}

        {terminal ? (
          /* Resultado final — banner distinto al recorrido, no compite por espacio con la barra de pasos. */
          <div className={`rounded-xl p-4 ${resultado?.clase ?? "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300"}`}>
            <div className="flex items-center gap-2">
              <Icon name={resultado?.icon ?? "mdi:flag-outline"} size={20} />
              <p className="text-theme-sm font-semibold">{etiquetaEstadoGestion(tipoLead, estadoGestion)}</p>
              {estadoGestionEn && (
                <span className="text-theme-xs opacity-70" title={formatearFechaCompleta(estadoGestionEn)}>
                  · {formatearRelativo(estadoGestionEn)}
                </span>
              )}
            </div>
            {motivoCierre && (
              <p className="mt-2 text-theme-xs opacity-90">
                Motivo: <span className="font-medium">{motivoCierre}</span>
                {notaCierre ? ` — ${notaCierre}` : ""}
              </p>
            )}

            {puedeGestionar && esAdmin && (
              <div className="mt-3">
                {!reabrirAbierto ? (
                  <button type="button" onClick={() => setReabrirAbierto(true)} className="text-theme-xs underline underline-offset-2 opacity-80 hover:opacity-100">
                    Reabrir lead
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-theme-xs opacity-80">Reabrir hacia:</span>
                    {ESTADOS_REAPERTURA.map((codigo) => (
                      <Button
                        key={codigo}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={gestionar.isPending}
                        onClick={() =>
                          gestionar.mutate({ estadoGestion: codigo }, { onSuccess: () => setReabrirAbierto(false) })
                        }
                      >
                        {etiquetaEstadoGestion(tipoLead, codigo)}
                      </Button>
                    ))}
                    <button type="button" onClick={() => setReabrirAbierto(false)} className="text-theme-xs opacity-70 hover:underline">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <PipelineStepper
              estados={estadosNoTerminales}
              estadoActual={estadoGestion}
              siguientes={puedeGestionar ? siguientes : []}
              disabled={!puedeGestionar || gestionar.isPending}
              onSelect={iniciarCambio}
            />

            {puedeGestionar && siguientes.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-theme-xs text-gray-400">Mover a:</span>
                {siguientes.map((codigo) => (
                  <Button
                    key={codigo}
                    type="button"
                    size="sm"
                    variant={esEstadoTerminal(codigo) ? "outline" : "primary"}
                    disabled={gestionar.isPending}
                    onClick={() => iniciarCambio(codigo)}
                  >
                    {etiquetaEstadoGestion(tipoLead, codigo)}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Form de motivo/nota al pasar a un estado terminal */}
        {destinoCierre && (
          <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
            <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-200">
              Pasar a {etiquetaEstadoGestion(tipoLead, destinoCierre)} — hace falta un motivo
            </p>
            <Select
              options={motivosParaDestino(destinoCierre).map((m) => ({ value: m.codigo, label: m.etiqueta }))}
              placeholder="Elige un motivo"
              value={motivoForm}
              onChange={setMotivoForm}
            />
            <TextArea
              rows={2}
              placeholder="Nota (opcional)"
              value={notaForm}
              onChange={(e) => setNotaForm(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                loading={gestionar.isPending}
                disabled={!motivoForm}
                onClick={confirmarCierre}
              >
                Confirmar
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setDestinoCierre(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {historialQuery.data && historialQuery.data.length > 0 && (
        <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
          <p className="mb-3 flex items-center gap-1.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
            <Icon name="mdi:timeline-clock-outline" size={14} />
            Historial
          </p>
          <PipelineTimeline filas={historialQuery.data} />
        </div>
      )}
    </div>
  );
}

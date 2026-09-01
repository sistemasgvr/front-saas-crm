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
import TransicionPipelineModal from "./TransicionPipelineModal";
import { camposParaDestino } from "./pipeline-transicion";
import { esEstadoTerminal, ETIQUETA_TIPO_LEAD, claseEstadoGestion, etiquetaEstadoGestion, iconoEstadoGestion } from "./pipeline";
import { TIPOS_LEAD_INMOBILIARIA, type EstadoPipelineMeta, type MetaPipeline, type MotivoMeta } from "./types";

const ESTADOS_REAPERTURA = ["CONTACTADO", "CALIFICADO"];

const ICONO_TIPO_LEAD: Record<string, string> = {
  COMPRA: "mdi:home-search-outline",
  VENTA: "mdi:home-export-outline",
  OTRO: "mdi:dots-horizontal-circle-outline",
};

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
  const [destinoTransicion, setDestinoTransicion] = useState<string | null>(null);
  const [esReapertura, setEsReapertura] = useState(false);
  const [motivoForm, setMotivoForm] = useState("");
  const [notaForm, setNotaForm] = useState("");
  const [reabrirAbierto, setReabrirAbierto] = useState(false);
  const [historialExpandido, setHistorialExpandido] = useState(false);

  const LIMITE_HISTORIAL = 5;

  const metaQuery = useQuery<MetaPipeline>({
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
    invalidateKeys: [queryKeys.lead(leadId), queryKeys.leadsAll, queryKeys.leadHistorial(leadId), queryKeys.leadVisitas(leadId)],
  });

  const estadoActualMeta = metaQuery.data?.estados.find(
    (estado: EstadoPipelineMeta) => estado.codigo === estadoGestion,
  );
  const siguientes = estadoActualMeta?.siguientes ?? [];
  const terminal = esEstadoTerminal(estadoGestion);
  const estadosNoTerminales =
    metaQuery.data?.estados.filter((estado: EstadoPipelineMeta) => !esEstadoTerminal(estado.codigo)) ?? [];

  const motivosParaDestino = (destino: string | null) => {
    if (!metaQuery.data || !destino) return [];
    if (destino === "DESCARTADO") return metaQuery.data.motivosDescarte;
    if (destino === "CERRADO_PERDIDO") return metaQuery.data.motivosPerdido;
    if (destino === "CERRADO_GANADO") return metaQuery.data.motivosGanado;
    return [];
  };

  const iniciarCambio = (destino: string, opciones?: { reapertura?: boolean }) => {
    if (esEstadoTerminal(destino)) {
      setDestinoCierre(destino);
      setMotivoForm("");
      setNotaForm("");
      return;
    }

    const campos = metaQuery.data
      ? camposParaDestino(metaQuery.data, destino, opciones?.reapertura)
      : [];

    if (campos.length > 0) {
      setDestinoTransicion(destino);
      setEsReapertura(Boolean(opciones?.reapertura));
      return;
    }

    gestionar.mutate({ estadoGestion: destino });
  };

  const confirmarTransicion = (payload: {
    notaTransicion?: string;
    metadata?: Record<string, string>;
  }) => {
    if (!destinoTransicion) return;
    gestionar.mutate(
      {
        estadoGestion: destinoTransicion,
        notaTransicion: payload.notaTransicion,
        metadata: payload.metadata,
      },
      {
        onSuccess: () => {
          setDestinoTransicion(null);
          setEsReapertura(false);
          setReabrirAbierto(false);
        },
      },
    );
  };

  const confirmarCierre = () => {
    if (!destinoCierre || !motivoForm) return;
    gestionar.mutate(
      { estadoGestion: destinoCierre, motivoCierre: motivoForm, notaCierre: notaForm || undefined },
      { onSuccess: () => setDestinoCierre(null) },
    );
  };

  const resultado = RESULTADO_CIERRE[estadoGestion];

  const historialCompleto = historialQuery.data ?? [];
  const historialOcultos = Math.max(0, historialCompleto.length - LIMITE_HISTORIAL);
  const historialVisible = historialExpandido
    ? historialCompleto
    : historialCompleto.slice(-LIMITE_HISTORIAL);

  return (
    <div className="space-y-6 pb-2">
      {/* Tipo de lead — selector segmentado */}
      {puedeGestionar ? (
        <div className="flex w-full flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 sm:inline-flex sm:w-auto dark:border-gray-700 dark:bg-gray-900/50">
          {TIPOS_LEAD_INMOBILIARIA.map((tipo) => (
            <button
              key={tipo}
              type="button"
              disabled={gestionar.isPending}
              onClick={() => gestionar.mutate({ tipoLead: tipo })}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-theme-xs font-medium transition sm:flex-none sm:py-1.5 ${
                tipoLead === tipo
                  ? "bg-white text-brand-600 shadow-theme-xs dark:bg-gray-800 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Icon name={ICONO_TIPO_LEAD[tipo] ?? "mdi:circle-outline"} size={16} />
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
      <div>
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
                        onClick={() => iniciarCambio(codigo, { reapertura: true })}
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
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900/20">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${claseEstadoGestion(estadoGestion)}`}
                  >
                    <Icon name={iconoEstadoGestion(estadoGestion)} size={22} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">Estado del lead</p>
                    <p className="text-base font-semibold text-gray-800 dark:text-white/90">
                      {etiquetaEstadoGestion(tipoLead, estadoGestion)}
                    </p>
                    {estadoGestionEn ? (
                      <p
                        className="text-theme-xs text-gray-400"
                        title={formatearFechaCompleta(estadoGestionEn)}
                      >
                        Desde {formatearRelativo(estadoGestionEn)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <PipelineStepper
                estados={estadosNoTerminales}
                estadoActual={estadoGestion}
                siguientes={puedeGestionar ? siguientes : []}
                disabled={!puedeGestionar || gestionar.isPending}
                onSelect={iniciarCambio}
              />
            </div>

            {puedeGestionar && siguientes.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5 dark:border-gray-800 dark:bg-white/[0.02]">
                <p className="mb-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Mover a otra etapa
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
                  {siguientes.map((codigo: string) => {
                    const esCierre = esEstadoTerminal(codigo);
                    return (
                      <button
                        key={codigo}
                        type="button"
                        disabled={gestionar.isPending}
                        onClick={() => iniciarCambio(codigo)}
                        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-theme-sm font-medium transition lg:w-auto ${
                          esCierre
                            ? "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            : "bg-brand-500 text-white hover:bg-brand-600 shadow-theme-xs"
                        }`}
                      >
                        <Icon name={iconoEstadoGestion(codigo)} size={17} />
                        {etiquetaEstadoGestion(tipoLead, codigo)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form de motivo/nota al pasar a un estado terminal */}
        {destinoCierre && (
          <div className="mt-4 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-200">
              Pasar a {etiquetaEstadoGestion(tipoLead, destinoCierre)} — hace falta un motivo
            </p>
            <Select
              options={motivosParaDestino(destinoCierre).map((motivo: MotivoMeta) => ({
                value: motivo.codigo,
                label: motivo.etiqueta,
              }))}
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

      {destinoTransicion && metaQuery.data && (
        <TransicionPipelineModal
          open
          titulo={`Pasar a ${etiquetaEstadoGestion(tipoLead, destinoTransicion)}`}
          descripcion="Completa los datos de esta etapa antes de confirmar el cambio."
          campos={camposParaDestino(metaQuery.data, destinoTransicion, esReapertura)}
          loading={gestionar.isPending}
          onConfirmar={confirmarTransicion}
          onCancelar={() => {
            setDestinoTransicion(null);
            setEsReapertura(false);
          }}
        />
      )}

      {/* Timeline — colapsable visualmente separado */}
      {historialCompleto.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
              <Icon name="mdi:history" size={14} />
              Actividad reciente
              <span className="rounded-full bg-gray-200/80 px-1.5 py-0.5 text-[10px] font-medium normal-case text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {historialCompleto.length}
              </span>
            </p>
            {historialOcultos > 0 && (
              <button
                type="button"
                onClick={() => setHistorialExpandido((prev) => !prev)}
                className="text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                {historialExpandido ? "Ver menos" : `Ver ${historialOcultos} más`}
              </button>
            )}
          </div>
          <div
            className={`px-4 py-3 ${
              historialExpandido ? "max-h-80 overflow-y-auto" : ""
            }`}
          >
            <PipelineTimeline filas={historialVisible} />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import Button from "@/src/components/ui/button/Button";
import Select from "@/src/components/form/Select";
import TextArea from "@/src/components/form/input/TextArea";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import EmptyState from "@/src/components/ui/EmptyState";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { canManageOrganization } from "@/src/lib/roles";
import { toast } from "sonner";
import { gestionarLeadAction } from "./actions";
import { getMetaPipeline, getTablero } from "./queries";
import ClasificarTipoLeadModal from "./ClasificarTipoLeadModal";
import TransicionPipelineModal from "./TransicionPipelineModal";
import { camposParaDestino } from "./pipeline-transicion";
import {
  ETIQUETA_TIPO_LEAD,
  esEstadoTerminal,
  esTransicionPermitidaEnMeta,
  etiquetaEstadoGestion,
  puntoEstadoGestion,
  requiereClasificarTipo,
  tipoLeadClasificado,
} from "./pipeline";
import { TIPOS_LEAD_INMOBILIARIA } from "./types";
import type { ColumnaTablero, LeadTableroRow, MetaPipeline, MotivoMeta, TableroResultado } from "./types";

type Rol = "PROPIETARIO" | "ADMINISTRADOR" | "USUARIO" | null;

interface PendingClose {
  leadId: string;
  destino: string;
}

interface PendingTransition {
  leadId: string;
  destino: string;
  tipoLead?: string;
}

interface PendingClassify {
  leadId: string;
  destino: string;
}

function LeadCard({
  lead,
  puedeArrastrar,
  mostrarTipo,
}: {
  lead: LeadTableroRow;
  puedeArrastrar: boolean;
  mostrarTipo: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: !puedeArrastrar,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 20 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(puedeArrastrar ? { ...listeners, ...attributes } : {})}
      className={`rounded-lg border border-gray-100 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 ${
        puedeArrastrar ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-90"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
          {lead.nombre ?? "Sin nombre"}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {mostrarTipo && (
            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
              {ETIQUETA_TIPO_LEAD[lead.tipoLead ?? "OTRO"] ?? "Otro"}
            </span>
          )}
          <Link
          href={`/leads/${lead.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 text-gray-400 hover:text-brand-500"
          title="Ver lead"
        >
          <Icon name="mdi:open-in-new" size={16} />
        </Link>
        </div>
      </div>
      {lead.telefono && (
        <p className="mt-1 flex items-center gap-1 text-theme-xs text-gray-500 dark:text-gray-400">
          <Icon name="mdi:phone-outline" size={13} />
          {lead.telefono}
        </p>
      )}
      <p className="mt-1.5 flex items-center gap-1 text-theme-xs text-gray-400">
        <Icon name={lead.asignado ? "mdi:account-check-outline" : "mdi:account-question-outline"} size={13} />
        {lead.asignado?.nombre ?? "Sin asignar"}
      </p>
    </div>
  );
}

function KanbanColumn({
  codigo,
  etiqueta,
  leads,
  usuarioId,
  esAdmin,
  mostrarTipo,
}: {
  codigo: string;
  etiqueta: string;
  leads: LeadTableroRow[];
  usuarioId: string;
  esAdmin: boolean;
  mostrarTipo: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: codigo });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border bg-gray-50/80 dark:bg-white/[0.02] ${
        isOver ? "border-brand-300 bg-brand-50/40 dark:border-brand-800" : "border-gray-100 dark:border-gray-800"
      }`}
    >
      <div className={`flex items-center gap-2 rounded-t-xl border-b border-gray-100 px-3 py-2.5 dark:border-gray-800`}>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${puntoEstadoGestion(codigo)}`} />
        <p className="min-w-0 flex-1 truncate text-theme-sm font-semibold text-gray-700 dark:text-gray-200">
          {etiqueta}
        </p>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
          {leads.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 320px)", minHeight: 120 }}>
        {leads.length === 0 && (
          <p className="px-2 py-6 text-center text-theme-xs text-gray-400">Sin leads</p>
        )}
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            puedeArrastrar={esAdmin || lead.asignado?.id === usuarioId}
            mostrarTipo={mostrarTipo}
          />
        ))}
      </div>
    </div>
  );
}

export default function LeadsKanbanView({ rol, usuarioId }: { rol: Rol; usuarioId: string }) {
  const esAdmin = canManageOrganization(rol);
  const [tipoFiltro, setTipoFiltro] = useState<string | null>(null);
  const [pendingClose, setPendingClose] = useState<PendingClose | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [pendingClassify, setPendingClassify] = useState<PendingClassify | null>(null);
  const [motivoForm, setMotivoForm] = useState("");
  const [notaForm, setNotaForm] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const tableroQuery = useQuery<TableroResultado>({
    queryKey: queryKeys.leadsTablero(tipoFiltro),
    queryFn: () => getTablero(tipoFiltro ?? undefined),
  });

  const metaCompra = useQuery<MetaPipeline>({
    queryKey: queryKeys.leadPipelineMeta("COMPRA"),
    queryFn: () => getMetaPipeline("COMPRA"),
    enabled: tipoFiltro === null || tipoFiltro === "COMPRA",
  });
  const metaVenta = useQuery<MetaPipeline>({
    queryKey: queryKeys.leadPipelineMeta("VENTA"),
    queryFn: () => getMetaPipeline("VENTA"),
    enabled: tipoFiltro === null || tipoFiltro === "VENTA",
  });
  const metaOtro = useQuery<MetaPipeline>({
    queryKey: queryKeys.leadPipelineMeta("OTRO"),
    queryFn: () => getMetaPipeline("OTRO"),
    enabled: tipoFiltro === null || tipoFiltro === "OTRO",
  });

  const metaParaLead = (lead?: LeadTableroRow, tipoOverride?: string): MetaPipeline | undefined => {
    const tipo = tipoOverride ?? lead?.tipoLead;
    if (!tipoLeadClasificado(tipo)) return undefined;
    if (tipo === "COMPRA") return metaCompra.data;
    if (tipo === "VENTA") return metaVenta.data;
    return metaOtro.data;
  };

  const tipoDeLead = (lead?: LeadTableroRow, tipoOverride?: string) =>
    tipoOverride ?? lead?.tipoLead ?? tipoFiltro ?? "OTRO";

  const gestionar = useAppMutation({
    mutationFn: ({
      leadId,
      ...input
    }: {
      leadId: string;
      estadoGestion: string;
      tipoLead?: string;
      motivoCierre?: string;
      notaCierre?: string;
      notaTransicion?: string;
      metadata?: Record<string, string>;
    }) => gestionarLeadAction(leadId, input),
    successMessage: "Lead movido",
    invalidateKeys: [queryKeys.leadsAll, queryKeys.leadsNuevosCount],
  });

  const leadPorId = useMemo(() => {
    const mapa = new Map<string, LeadTableroRow>();
    for (const columna of tableroQuery.data?.columnas ?? []) {
      for (const lead of columna.leads) mapa.set(lead.id, lead);
    }
    return mapa;
  }, [tableroQuery.data]);

  const motivosParaDestino = (destino: string, meta?: MetaPipeline): MotivoMeta[] => {
    if (!meta) return [];
    if (destino === "DESCARTADO") return meta.motivosDescarte;
    if (destino === "CERRADO_PERDIDO") return meta.motivosPerdido;
    if (destino === "CERRADO_GANADO") return meta.motivosGanado;
    return [];
  };

  const procesarAvance = (lead: LeadTableroRow, destino: string, tipoLead?: string) => {
    if (requiereClasificarTipo(lead)) {
      setPendingClassify({ leadId: lead.id, destino });
      return;
    }

    const meta = metaParaLead(lead, tipoLead);
    if (!meta || !esTransicionPermitidaEnMeta(meta, lead.estadoGestion, destino)) {
      toast.error("Esa transición no es válida para este lead");
      return;
    }

    const payload = {
      leadId: lead.id,
      estadoGestion: destino,
      ...(tipoLead ? { tipoLead } : {}),
    };

    if (esEstadoTerminal(destino)) {
      setPendingClose({ leadId: lead.id, destino });
      setMotivoForm("");
      setNotaForm("");
      return;
    }

    const campos = camposParaDestino(meta, destino);
    if (campos.length > 0) {
      setPendingTransition({ leadId: lead.id, destino, tipoLead });
      return;
    }

    gestionar.mutate(payload);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const leadId = String(active.id);
    const destino = String(over.id);
    const lead = leadPorId.get(leadId);
    if (!lead || lead.estadoGestion === destino) return;

    procesarAvance(lead, destino);
  };

  const confirmarClasificacion = (tipo: string) => {
    if (!pendingClassify) return;
    const lead = leadPorId.get(pendingClassify.leadId);
    if (!lead) return;
    const destino = pendingClassify.destino;
    setPendingClassify(null);
    procesarAvance({ ...lead, tipoLead: tipo }, destino, tipo);
  };

  const confirmarCierre = () => {
    if (!pendingClose || !motivoForm) return;
    gestionar.mutate(
      {
        leadId: pendingClose.leadId,
        estadoGestion: pendingClose.destino,
        motivoCierre: motivoForm,
        notaCierre: notaForm || undefined,
      },
      { onSuccess: () => setPendingClose(null) },
    );
  };

  const leadEnCierre = pendingClose ? leadPorId.get(pendingClose.leadId) : undefined;
  const leadEnTransicion = pendingTransition ? leadPorId.get(pendingTransition.leadId) : undefined;
  const metaTransicion = leadEnTransicion
    ? metaParaLead(leadEnTransicion, pendingTransition?.tipoLead)
    : undefined;

  return (
    <div>
      <PageHeader
        title="Tablero"
        description="Arrastra un lead a otra columna para avanzarlo en el pipeline — misma validación que la vista de detalle."
        backHref="/leads"
        backLabel="Volver a la lista"
      >
        <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setTipoFiltro(null)}
            className={`rounded-md px-3 py-1.5 text-theme-sm font-medium transition ${
              tipoFiltro === null
                ? "bg-white text-brand-500 shadow-theme-xs dark:bg-gray-800 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Todos
          </button>
          {TIPOS_LEAD_INMOBILIARIA.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setTipoFiltro(tipo)}
              className={`rounded-md px-3 py-1.5 text-theme-sm font-medium transition ${
                tipoFiltro === tipo
                  ? "bg-white text-brand-500 shadow-theme-xs dark:bg-gray-800 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {ETIQUETA_TIPO_LEAD[tipo] ?? tipo}
            </button>
          ))}
        </div>
      </PageHeader>

      {(metaCompra.isError || metaVenta.isError || metaOtro.isError) && (
        <QueryError error={metaCompra.error ?? metaVenta.error ?? metaOtro.error} />
      )}

      {tableroQuery.isLoading ? (
        <PageLoader />
      ) : tableroQuery.isError ? (
        <QueryError error={tableroQuery.error} />
      ) : !tableroQuery.data || tableroQuery.data.columnas.every((c: ColumnaTablero) => c.leads.length === 0) ? (
        <EmptyState
          icon="mdi:view-column-outline"
          title="No hay leads en el tablero"
          description={tipoFiltro ? "Prueba otro filtro o revisa la lista de leads." : "Cuando entren leads aparecerán aquí por etapa."}
        />
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {tableroQuery.data.columnas.map((columna: ColumnaTablero) => (
              <KanbanColumn
                key={columna.codigo}
                codigo={columna.codigo}
                etiqueta={columna.etiqueta}
                leads={columna.leads}
                usuarioId={usuarioId}
                esAdmin={esAdmin}
                mostrarTipo={tipoFiltro === null}
              />
            ))}
          </div>
        </DndContext>
      )}

      {pendingClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Mover a {etiquetaEstadoGestion(tipoDeLead(leadEnCierre), pendingClose.destino)}
              {leadEnCierre?.nombre ? ` — ${leadEnCierre.nombre}` : ""}
            </p>
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">Hace falta un motivo para cerrar el lead.</p>
            <div className="mt-3 space-y-2">
              <Select
                options={motivosParaDestino(pendingClose.destino, metaParaLead(leadEnCierre)).map((m: MotivoMeta) => ({
                  value: m.codigo,
                  label: m.etiqueta,
                }))}
                placeholder="Elige un motivo"
                value={motivoForm}
                onChange={setMotivoForm}
              />
              <TextArea rows={2} placeholder="Nota (opcional)" value={notaForm} onChange={(e) => setNotaForm(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setPendingClose(null)}>
                Cancelar
              </Button>
              <Button type="button" size="sm" loading={gestionar.isPending} disabled={!motivoForm} onClick={confirmarCierre}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingTransition && metaTransicion && (
        <TransicionPipelineModal
          open
          titulo={`Mover a ${etiquetaEstadoGestion(tipoDeLead(leadEnTransicion, pendingTransition.tipoLead), pendingTransition.destino)}${
            leadEnTransicion?.nombre ? ` — ${leadEnTransicion.nombre}` : ""
          }`}
          descripcion="Completa los datos de esta etapa antes de confirmar."
          campos={camposParaDestino(metaTransicion, pendingTransition.destino)}
          loading={gestionar.isPending}
          onConfirmar={(payload) =>
            gestionar.mutate(
              {
                leadId: pendingTransition.leadId,
                estadoGestion: pendingTransition.destino,
                ...(pendingTransition.tipoLead ? { tipoLead: pendingTransition.tipoLead } : {}),
                notaTransicion: payload.notaTransicion,
                metadata: payload.metadata,
              },
              { onSuccess: () => setPendingTransition(null) },
            )
          }
          onCancelar={() => setPendingTransition(null)}
        />
      )}

      <ClasificarTipoLeadModal
        open={Boolean(pendingClassify)}
        nombreLead={pendingClassify ? leadPorId.get(pendingClassify.leadId)?.nombre : undefined}
        destinoEtiqueta={
          pendingClassify
            ? etiquetaEstadoGestion(tipoFiltro, pendingClassify.destino)
            : undefined
        }
        loading={gestionar.isPending}
        onElegir={confirmarClasificacion}
        onCancelar={() => setPendingClassify(null)}
      />
    </div>
  );
}

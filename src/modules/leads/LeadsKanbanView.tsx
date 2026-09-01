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
import { gestionarLeadAction } from "./actions";
import { getMetaPipeline, getTablero } from "./queries";
import TransicionPipelineModal from "./TransicionPipelineModal";
import { camposParaDestino } from "./pipeline-transicion";
import { ETIQUETA_TIPO_LEAD, esEstadoTerminal, etiquetaEstadoGestion, puntoEstadoGestion } from "./pipeline";
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
}

function LeadCard({
  lead,
  puedeArrastrar,
}: {
  lead: LeadTableroRow;
  puedeArrastrar: boolean;
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
        <Link
          href={`/leads/${lead.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 text-gray-400 hover:text-brand-500"
          title="Ver lead"
        >
          <Icon name="mdi:open-in-new" size={16} />
        </Link>
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
}: {
  codigo: string;
  etiqueta: string;
  leads: LeadTableroRow[];
  usuarioId: string;
  esAdmin: boolean;
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
          <LeadCard key={lead.id} lead={lead} puedeArrastrar={esAdmin || lead.asignado?.id === usuarioId} />
        ))}
      </div>
    </div>
  );
}

export default function LeadsKanbanView({ rol, usuarioId }: { rol: Rol; usuarioId: string }) {
  const esAdmin = canManageOrganization(rol);
  // Arranca en "Otro": un lead nuevo entra sin tipoLead definido (nadie
  // eligió todavía si es Compra o Venta) y el backend lo trata como parte
  // del embudo Otro hasta que se clasifica — si abriera en Compra, la bandeja
  // real de leads entrantes quedaría escondida en otra pestaña.
  const [tipoLead, setTipoLead] = useState<string>("OTRO");
  const [pendingClose, setPendingClose] = useState<PendingClose | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [motivoForm, setMotivoForm] = useState("");
  const [notaForm, setNotaForm] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const tableroQuery = useQuery<TableroResultado>({
    queryKey: queryKeys.leadsTablero(tipoLead),
    queryFn: () => getTablero(tipoLead),
  });
  const metaQuery = useQuery<MetaPipeline>({
    queryKey: queryKeys.leadPipelineMeta(tipoLead),
    queryFn: () => getMetaPipeline(tipoLead),
  });

  const gestionar = useAppMutation({
    mutationFn: ({
      leadId,
      ...input
    }: {
      leadId: string;
      estadoGestion: string;
      motivoCierre?: string;
      notaCierre?: string;
      notaTransicion?: string;
      metadata?: Record<string, string>;
    }) => gestionarLeadAction(leadId, input),
    successMessage: "Lead movido",
    invalidateKeys: [queryKeys.leadsTablero(tipoLead), queryKeys.leadsAll],
  });

  const leadPorId = useMemo(() => {
    const mapa = new Map<string, LeadTableroRow>();
    for (const columna of tableroQuery.data?.columnas ?? []) {
      for (const lead of columna.leads) mapa.set(lead.id, lead);
    }
    return mapa;
  }, [tableroQuery.data]);

  const motivosParaDestino = (destino: string): MotivoMeta[] => {
    if (!metaQuery.data) return [];
    if (destino === "DESCARTADO") return metaQuery.data.motivosDescarte;
    if (destino === "CERRADO_PERDIDO") return metaQuery.data.motivosPerdido;
    if (destino === "CERRADO_GANADO") return metaQuery.data.motivosGanado;
    return [];
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const leadId = String(active.id);
    const destino = String(over.id);
    const lead = leadPorId.get(leadId);
    if (!lead || lead.estadoGestion === destino) return;

    if (esEstadoTerminal(destino)) {
      setPendingClose({ leadId, destino });
      setMotivoForm("");
      setNotaForm("");
      return;
    }

    const campos = metaQuery.data ? camposParaDestino(metaQuery.data, destino) : [];
    if (campos.length > 0) {
      setPendingTransition({ leadId, destino });
      return;
    }

    gestionar.mutate({ leadId, estadoGestion: destino });
  };

  const confirmarCierre = () => {
    if (!pendingClose || !motivoForm) return;
    gestionar.mutate(
      { leadId: pendingClose.leadId, estadoGestion: pendingClose.destino, motivoCierre: motivoForm, notaCierre: notaForm || undefined },
      { onSuccess: () => setPendingClose(null) },
    );
  };

  const leadEnCierre = pendingClose ? leadPorId.get(pendingClose.leadId) : undefined;
  const leadEnTransicion = pendingTransition ? leadPorId.get(pendingTransition.leadId) : undefined;

  return (
    <div>
      <PageHeader
        title="Tablero"
        description="Arrastra un lead a otra columna para avanzarlo en el pipeline — misma validación que la vista de detalle."
        backHref="/leads"
        backLabel="Volver a la lista"
      >
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/5">
          {TIPOS_LEAD_INMOBILIARIA.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setTipoLead(tipo)}
              className={`rounded-md px-3 py-1.5 text-theme-sm font-medium transition ${
                tipoLead === tipo
                  ? "bg-white text-brand-500 shadow-theme-xs dark:bg-gray-800 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {ETIQUETA_TIPO_LEAD[tipo] ?? tipo}
            </button>
          ))}
        </div>
      </PageHeader>

      {tipoLead === "OTRO" && (
        <p className="-mt-3 mb-4 flex items-center gap-1.5 text-theme-xs text-gray-400">
          <Icon name="mdi:information-outline" size={14} />
          Acá también caen los leads nuevos sin Compra/Venta definido todavía — clasifícalos desde su detalle para
          que pasen a esa pestaña.
        </p>
      )}

      {metaQuery.isError && <QueryError error={metaQuery.error} />}

      {tableroQuery.isLoading ? (
        <PageLoader />
      ) : tableroQuery.isError ? (
        <QueryError error={tableroQuery.error} />
      ) : !tableroQuery.data || tableroQuery.data.columnas.every((c: ColumnaTablero) => c.leads.length === 0) ? (
        <EmptyState
          icon="mdi:view-column-outline"
          title="No hay leads de este tipo"
          description="Cambia de pestaña o ajusta la gestión de leads existentes."
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
              />
            ))}
          </div>
        </DndContext>
      )}

      {pendingClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Mover a {etiquetaEstadoGestion(tipoLead, pendingClose.destino)}
              {leadEnCierre?.nombre ? ` — ${leadEnCierre.nombre}` : ""}
            </p>
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">Hace falta un motivo para cerrar el lead.</p>
            <div className="mt-3 space-y-2">
              <Select
                options={motivosParaDestino(pendingClose.destino).map((m: MotivoMeta) => ({
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

      {pendingTransition && metaQuery.data && (
        <TransicionPipelineModal
          open
          titulo={`Mover a ${etiquetaEstadoGestion(tipoLead, pendingTransition.destino)}${
            leadEnTransicion?.nombre ? ` — ${leadEnTransicion.nombre}` : ""
          }`}
          descripcion="Completa los datos de esta etapa antes de confirmar."
          campos={camposParaDestino(metaQuery.data, pendingTransition.destino)}
          loading={gestionar.isPending}
          onConfirmar={(payload) =>
            gestionar.mutate(
              {
                leadId: pendingTransition.leadId,
                estadoGestion: pendingTransition.destino,
                notaTransicion: payload.notaTransicion,
                metadata: payload.metadata,
              },
              { onSuccess: () => setPendingTransition(null) },
            )
          }
          onCancelar={() => setPendingTransition(null)}
        />
      )}
    </div>
  );
}

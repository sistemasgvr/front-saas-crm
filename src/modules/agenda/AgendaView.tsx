"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import Select from "@/src/components/form/Select";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { QueryError } from "@/src/components/ui/PageLoader";
import { CalendarSkeleton } from "@/src/components/ui/skeletons";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { canManageOrganization } from "@/src/lib/roles";
import {
  actualizarActividadAgendaAction,
  actualizarVisitaAgendaAction,
  crearActividadAgendaAction,
} from "@/src/modules/leads/actions";
import { getAgendaVisitas, getAsignables } from "@/src/modules/leads/queries";
import type {
  ActualizarActividadAgendaInput,
  ActualizarVisitaAgendaInput,
  AgendaItemRow,
  CrearActividadAgendaInput,
  ReferenciaNombrada,
} from "@/src/modules/leads/types";
import AgendaItemDetalleModal from "./AgendaItemDetalleModal";
import CrearActividadAgendaModal from "./CrearActividadAgendaModal";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

type Rol = "PROPIETARIO" | "ADMINISTRADOR" | "USUARIO" | null;

const COLOR_ESTADO: Record<string, string> = {
  PROGRAMADA: "#465fff",
  REALIZADA: "#12b76a",
  COMPLETADA: "#12b76a",
  NO_SHOW: "#f79009",
  CANCELADA: "#98a2b3",
};

const ETIQUETA_TIPO: Record<string, string> = {
  VISITA: "Visita",
  LLAMADA: "Llamada",
  REUNION: "Reunión",
  SEGUIMIENTO: "Seguimiento",
  OTRO: "Otra",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  PROGRAMADA: "Programada",
  REALIZADA: "Realizada",
  COMPLETADA: "Completada",
  NO_SHOW: "No show",
  CANCELADA: "Cancelada",
};

function rangoInicial(): { desde: string; hasta: string } {
  const ahora = new Date();
  const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const hasta = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

function itemAEvento(item: AgendaItemRow): EventInput {
  const lead = item.leadNombre ?? "Sin nombre";
  const tipo = ETIQUETA_TIPO[item.tipo] ?? item.tipo;
  const asesor = item.asignado?.nombre ?? "Sin asesor";
  const estado = ETIQUETA_ESTADO[item.estado] ?? item.estado;
  const modalidad =
    item.modalidad === "VIRTUAL"
      ? "Virtual"
      : item.modalidad === "PRESENCIAL"
        ? "Presencial"
        : null;
  const detalleParts = [
    tipo,
    modalidad,
    `${item.duracionMinutos} min`,
    asesor,
  ].filter(Boolean);

  return {
    id: `${item.origen}:${item.id}`,
    title: `${item.titulo} · ${lead}`,
    start: item.programadaEn,
    end: item.programadaFin,
    backgroundColor: COLOR_ESTADO[item.estado] ?? COLOR_ESTADO.PROGRAMADA,
    borderColor: COLOR_ESTADO[item.estado] ?? COLOR_ESTADO.PROGRAMADA,
    extendedProps: {
      item,
      leadId: item.leadId,
      leadNombre: lead,
      telefono: item.leadTelefono,
      titulo: item.titulo,
      tipo,
      duracion: `${item.duracionMinutos} min`,
      asesor,
      estado,
      detalle: detalleParts.join(" · "),
    },
  };
}

function EventoContenido({ arg }: { arg: EventContentArg }) {
  const p = arg.event.extendedProps;
  const vistaLista = arg.view.type.startsWith("list");
  if (vistaLista) {
    return (
      <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
        <span className="font-medium text-gray-800 dark:text-white/90">
          {String(p.tipo)} · {String(p.titulo ?? arg.event.title)}
        </span>
        <span className="text-theme-xs text-gray-600 dark:text-gray-300">
          {String(p.leadNombre ?? "")}
          {p.telefono ? ` · ${String(p.telefono)}` : ""}
        </span>
        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
          {String(p.detalle ?? "")} · {String(p.estado ?? "")}
        </span>
      </div>
    );
  }
  return (
    <div className="fc-event-main-frame overflow-hidden px-0.5 leading-tight">
      {arg.timeText ? <div className="fc-event-time text-[10px] opacity-90">{arg.timeText}</div> : null}
      <div className="fc-event-title-container">
        <div className="fc-event-title truncate text-[11px] font-semibold">
          {String(p.tipo)} · {String(p.titulo ?? "")}
        </div>
        <div className="truncate text-[10px] opacity-90">{String(p.leadNombre ?? "")}</div>
        <div className="truncate text-[10px] opacity-80">{String(p.detalle ?? "")}</div>
      </div>
    </div>
  );
}

export default function AgendaView({
  rol,
  usuarioId,
  crmHabilitado = false,
}: {
  rol: Rol;
  usuarioId: string;
  crmHabilitado?: boolean;
}) {
  const esAdmin = canManageOrganization(rol);
  const [rango, setRango] = useState(rangoInicial);
  const [asignadoFiltro, setAsignadoFiltro] = useState(esAdmin ? "todos" : "mios");
  const [vistaInicial, setVistaInicial] = useState("timeGridWeek");
  const [esMovil, setEsMovil] = useState(false);
  const [calendarioListo, setCalendarioListo] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<AgendaItemRow | null>(null);
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [slotInicial, setSlotInicial] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setEsMovil(mq.matches);
    setEsMovil(mq.matches);
    setVistaInicial(mq.matches ? "listWeek" : "timeGridWeek");
    setCalendarioListo(true);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const asignablesQuery = useQuery({
    queryKey: queryKeys.leadsAsignables,
    queryFn: getAsignables,
    enabled: esAdmin,
  });

  const agendaQuery = useQuery({
    queryKey: queryKeys.leadsAgenda({
      desde: rango.desde,
      hasta: rango.hasta,
      asignado: asignadoFiltro,
    }),
    queryFn: () =>
      getAgendaVisitas({
        desde: rango.desde,
        hasta: rango.hasta,
        asignado: asignadoFiltro,
      }),
  });

  const crearActividad = useAppMutation({
    mutationFn: (input: CrearActividadAgendaInput) => crearActividadAgendaAction(input),
    successMessage: "Actividad agendada",
    invalidateKeys: [queryKeys.leadsAgendaAll, queryKeys.leadsAll],
  });

  const actualizarVisita = useAppMutation({
    mutationFn: ({
      visitaId,
      input,
    }: {
      visitaId: string;
      input: ActualizarVisitaAgendaInput;
    }) => actualizarVisitaAgendaAction(visitaId, input),
    successMessage: "Visita actualizada",
    invalidateKeys: [queryKeys.leadsAgendaAll, queryKeys.leadsAll],
  });

  const actualizarActividad = useAppMutation({
    mutationFn: ({
      actividadId,
      input,
    }: {
      actividadId: string;
      input: ActualizarActividadAgendaInput;
    }) => actualizarActividadAgendaAction(actividadId, input),
    successMessage: "Actividad actualizada",
    invalidateKeys: [queryKeys.leadsAgendaAll, queryKeys.leadsAll],
  });

  const events = useMemo(
    () => (agendaQuery.data ?? []).map(itemAEvento),
    [agendaQuery.data],
  );

  const opcionesAsignado = useMemo(() => {
    const base = [
      { value: "todos", label: "Todos los asesores" },
      { value: "mios", label: "Mis actividades" },
    ];
    const extras = (asignablesQuery.data ?? [])
      .filter((u: ReferenciaNombrada) => u.id !== usuarioId)
      .map((u: ReferenciaNombrada) => ({ value: u.id, label: u.nombre }));
    return [...base, ...extras];
  }, [asignablesQuery.data, usuarioId]);

  function onDatesSet(arg: DatesSetArg) {
    const desde = arg.start.toISOString();
    const hasta = new Date(arg.end.getTime() - 1).toISOString();
    setRango((prev) => {
      if (prev.desde === desde && prev.hasta === hasta) return prev;
      return { desde, hasta };
    });
  }

  function onEventClick(arg: EventClickArg) {
    const item = arg.event.extendedProps.item as AgendaItemRow | undefined;
    if (item) setItemSeleccionado(item);
  }

  function onDateSelect(arg: DateSelectArg) {
    setSlotInicial(arg.start.toISOString());
    setCrearAbierto(true);
    arg.view.calendar.unselect();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Agenda"
        description="Actividades del equipo (llamadas, reuniones, seguimientos y visitas). Crea desde aquí sin pasar por el pipeline."
      >
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {esAdmin ? (
            <div className="w-full min-w-0 sm:w-64">
              <Select
                options={opcionesAsignado}
                value={asignadoFiltro}
                onChange={setAsignadoFiltro}
                placeholder="Filtrar asesor"
              />
            </div>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="primary"
            className="w-full sm:w-auto"
            startIcon={<Icon name="mdi:calendar-plus" size={18} />}
            onClick={() => {
              setSlotInicial(null);
              setCrearAbierto(true);
            }}
          >
            Nueva actividad
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap gap-x-3 gap-y-2 text-theme-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" /> Programada
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-success-500" /> Completada
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-warning-500" /> No show
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-400" /> Cancelada
        </span>
      </div>

      {agendaQuery.isError ? <QueryError error={agendaQuery.error} /> : null}

      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-white/[0.03] sm:p-4">
        {agendaQuery.isLoading || !calendarioListo ? (
          <CalendarSkeleton />
        ) : (
          <div className="agenda-calendar min-h-[28rem] text-theme-sm text-gray-800 sm:min-h-[32rem] dark:text-gray-200">
            <FullCalendar
              key={esMovil ? "agenda-movil" : "agenda-desktop"}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              locale={esLocale}
              timeZone="America/Lima"
              initialView={vistaInicial}
              headerToolbar={
                esMovil
                  ? {
                      left: "prev,next",
                      center: "title",
                      right: "today",
                    }
                  : {
                      left: "prev,next today",
                      center: "title",
                      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                    }
              }
              footerToolbar={
                esMovil
                  ? {
                      center: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                    }
                  : false
              }
              height="auto"
              contentHeight="auto"
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
              slotDuration="00:30:00"
              allDaySlot={false}
              nowIndicator
              weekends
              editable={false}
              selectable
              selectMirror
              stickyHeaderDates={!esMovil}
              dayMaxEvents={esMovil ? 2 : true}
              events={events}
              datesSet={onDatesSet}
              eventClick={onEventClick}
              select={onDateSelect}
              eventContent={(arg) => <EventoContenido arg={arg} />}
              eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
              buttonText={{
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                list: "Lista",
              }}
            />
          </div>
        )}
      </div>

      {itemSeleccionado ? (
        <AgendaItemDetalleModal
          item={itemSeleccionado}
          loading={actualizarVisita.isPending || actualizarActividad.isPending}
          crmHabilitado={crmHabilitado}
          onClose={() => setItemSeleccionado(null)}
          onActualizarVisita={(visitaId, input) => {
            actualizarVisita.mutate(
              { visitaId, input },
              { onSuccess: () => setItemSeleccionado(null) },
            );
          }}
          onActualizarActividad={(actividadId, input) => {
            actualizarActividad.mutate(
              { actividadId, input },
              { onSuccess: () => setItemSeleccionado(null) },
            );
          }}
        />
      ) : null}

      {crearAbierto ? (
        <CrearActividadAgendaModal
          open={crearAbierto}
          esAdmin={esAdmin}
          usuarioId={usuarioId}
          initialStart={slotInicial}
          loading={crearActividad.isPending}
          onClose={() => {
            setCrearAbierto(false);
            setSlotInicial(null);
          }}
          onCrear={(input) => {
            crearActividad.mutate(input, {
              onSuccess: () => {
                setCrearAbierto(false);
                setSlotInicial(null);
              },
            });
          }}
        />
      ) : null}
    </div>
  );
}

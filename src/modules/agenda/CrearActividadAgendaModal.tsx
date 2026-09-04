"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";
import Select from "@/src/components/form/Select";
import Input from "@/src/components/form/input/InputField";
import TextArea from "@/src/components/form/input/TextArea";
import { queryKeys } from "@/src/lib/query/keys";
import { datetimeLocalAISO } from "@/src/modules/leads/pipeline-transicion";
import { getAsignables, getLeads } from "@/src/modules/leads/queries";
import type {
  CrearActividadAgendaInput,
  LeadResumen,
  ReferenciaNombrada,
} from "@/src/modules/leads/types";
import InmuebleSelect from "@/src/modules/inmuebles/InmuebleSelect";

const TIPOS = [
  { value: "LLAMADA", label: "Llamada" },
  { value: "REUNION", label: "Reunión" },
  { value: "SEGUIMIENTO", label: "Seguimiento" },
  { value: "VISITA", label: "Visita a inmueble" },
  { value: "OTRO", label: "Otra actividad" },
];

const DURACIONES = [
  { value: "30", label: "30 minutos" },
  { value: "60", label: "60 minutos" },
  { value: "90", label: "90 minutos" },
  { value: "120", label: "2 horas" },
  { value: "180", label: "3 horas" },
];

const MODALIDADES = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "VIRTUAL", label: "Virtual / videollamada" },
];

function aDatetimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CrearActividadAgendaModal({
  open,
  esAdmin,
  usuarioId,
  initialStart,
  loading,
  onClose,
  onCrear,
}: {
  open: boolean;
  esAdmin: boolean;
  usuarioId: string;
  initialStart?: string | null;
  loading?: boolean;
  onClose: () => void;
  onCrear: (input: CrearActividadAgendaInput) => void;
}) {
  const [tipo, setTipo] = useState("LLAMADA");
  const [titulo, setTitulo] = useState("");
  const [q, setQ] = useState("");
  const [leadId, setLeadId] = useState("");
  const [programadaEn, setProgramadaEn] = useState(() =>
    aDatetimeLocal(initialStart ?? undefined),
  );
  const [duracionMinutos, setDuracionMinutos] = useState("60");
  const [referenciaInmueble, setReferenciaInmueble] = useState("");
  const [inmuebleId, setInmuebleId] = useState("");
  const [modalidad, setModalidad] = useState("PRESENCIAL");
  const [nota, setNota] = useState("");
  const [asignadoUsuarioId, setAsignadoUsuarioId] = useState(usuarioId);

  const esVisita = tipo === "VISITA";

  const leadsQuery = useQuery({
    queryKey: queryKeys.leads({ q, page: 1 }),
    queryFn: () =>
      getLeads({
        q: q.trim() || undefined,
        page: 1,
        asignado: esAdmin ? undefined : "mios",
      }),
    enabled: open,
  });

  const asignablesQuery = useQuery({
    queryKey: queryKeys.leadsAsignables,
    queryFn: getAsignables,
    enabled: open && esAdmin,
  });

  const opcionesLead = useMemo(() => {
    const rows = leadsQuery.data?.data ?? [];
    return rows.map((l: LeadResumen) => ({
      value: l.id,
      label: [l.nombre ?? "Sin nombre", l.telefono, l.asignado?.nombre]
        .filter(Boolean)
        .join(" · "),
    }));
  }, [leadsQuery.data]);

  const opcionesAsignado = useMemo(
    () =>
      (asignablesQuery.data ?? []).map((u: ReferenciaNombrada) => ({
        value: u.id,
        label: u.nombre,
      })),
    [asignablesQuery.data],
  );

  const puedeCrear =
    Boolean(leadId) &&
    Boolean(programadaEn) &&
    (!esVisita || Boolean(referenciaInmueble.trim()));

  function handleCrear() {
    if (!puedeCrear) return;
    onCrear({
      leadId,
      tipo,
      titulo: titulo.trim() || undefined,
      programadaEn: datetimeLocalAISO(programadaEn),
      duracionMinutos: Number(duracionMinutos) || 60,
      ...(esVisita
        ? {
            referenciaInmueble: referenciaInmueble.trim(),
            modalidad,
          }
        : {}),
      nota: nota.trim() || undefined,
      ...(esAdmin && asignadoUsuarioId ? { asignadoUsuarioId } : {}),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      header={
        <div className="p-5 pb-4 pr-14 sm:p-6 sm:pb-4 sm:pr-16">
          <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
            Nueva actividad
          </p>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            Llamada, reunión, seguimiento o visita — sin mover el pipeline. Lun–sáb
            08:00–20:00 Lima.
          </p>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end sm:p-5">
          <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            className="w-full sm:w-auto"
            loading={loading}
            disabled={!puedeCrear}
            onClick={handleCrear}
          >
            Agendar actividad
          </Button>
        </div>
      }
    >
      <div className="space-y-3 p-5 pt-4 sm:p-6 sm:pt-4">
        <div>
          <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
            Tipo <span className="text-error-500">*</span>
          </label>
          <Select options={TIPOS} value={tipo} onChange={setTipo} />
        </div>
        <div>
          <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
            Título (opcional)
          </label>
          <Input
            type="text"
            placeholder={
              esVisita ? "Ej. Visita Domaria — se genera solo si lo dejas vacío" : "Ej. Llamada de seguimiento"
            }
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
            Buscar lead
          </label>
          <Input
            type="search"
            placeholder="Nombre, teléfono o correo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
            Lead <span className="text-error-500">*</span>
          </label>
          <Select
            options={opcionesLead}
            value={leadId}
            onChange={setLeadId}
            placeholder={leadsQuery.isLoading ? "Cargando…" : "Elige un lead"}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
            Fecha y hora <span className="text-error-500">*</span>
          </label>
          <Input
            type="datetime-local"
            value={programadaEn}
            onChange={(e) => setProgramadaEn(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
              Duración
            </label>
            <Select options={DURACIONES} value={duracionMinutos} onChange={setDuracionMinutos} />
          </div>
          {esVisita ? (
            <div>
              <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                Modalidad
              </label>
              <Select options={MODALIDADES} value={modalidad} onChange={setModalidad} />
            </div>
          ) : null}
        </div>
        {esVisita ? (
          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
              Inmueble o proyecto <span className="text-error-500">*</span>
            </label>
            <InmuebleSelect
              inmuebleId={inmuebleId}
              referencia={referenciaInmueble}
              required
              onChange={({ inmuebleId: nextId, referencia }) => {
                setInmuebleId(nextId);
                setReferenciaInmueble(referencia);
              }}
            />
          </div>
        ) : null}
        {esAdmin ? (
          <div>
            <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
              Asesor
            </label>
            <Select
              options={opcionesAsignado}
              value={asignadoUsuarioId}
              onChange={setAsignadoUsuarioId}
              placeholder="Asesor responsable"
            />
          </div>
        ) : null}
        <div>
          <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
            Nota (opcional)
          </label>
          <TextArea
            rows={2}
            placeholder="Detalle, acuerdos, recordatorio…"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

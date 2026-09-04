"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";
import Select from "@/src/components/form/Select";
import Input from "@/src/components/form/input/InputField";
import TextArea from "@/src/components/form/input/TextArea";
import { Icon } from "@/src/components/ui/Icon";
import { datetimeLocalAISO } from "@/src/modules/leads/pipeline-transicion";
import type {
  ActualizarActividadAgendaInput,
  ActualizarVisitaAgendaInput,
  AgendaItemRow,
} from "@/src/modules/leads/types";

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

const DURACIONES = [
  { value: "30", label: "30 minutos" },
  { value: "60", label: "60 minutos" },
  { value: "90", label: "90 minutos" },
  { value: "120", label: "2 horas" },
  { value: "180", label: "3 horas" },
];

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "full",
    timeStyle: "short",
  });
}

function aDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AgendaItemDetalleModal({
  item,
  loading,
  onClose,
  onActualizarVisita,
  onActualizarActividad,
  crmHabilitado = false,
}: {
  item: AgendaItemRow | null;
  loading?: boolean;
  onClose: () => void;
  onActualizarVisita: (id: string, input: ActualizarVisitaAgendaInput) => void;
  onActualizarActividad: (id: string, input: ActualizarActividadAgendaInput) => void;
  crmHabilitado?: boolean;
}) {
  const router = useRouter();
  const [modoReagendar, setModoReagendar] = useState(false);
  const [programadaEn, setProgramadaEn] = useState("");
  const [duracionMinutos, setDuracionMinutos] = useState("60");
  const [notaCierre, setNotaCierre] = useState("");

  if (!item) return null;

  const abierta = item.estado === "PROGRAMADA";
  const esActividad = item.origen === "actividad";

  function abrirReagendar() {
    setProgramadaEn(aDatetimeLocal(item!.programadaEn));
    setDuracionMinutos(String(item!.duracionMinutos || 60));
    setModoReagendar(true);
  }

  function confirmarReagendar() {
    if (!programadaEn) return;
    const payload = {
      programadaEn: datetimeLocalAISO(programadaEn),
      duracionMinutos: Number(duracionMinutos) || 60,
    };
    if (esActividad) onActualizarActividad(item!.id, payload);
    else onActualizarVisita(item!.id, payload);
  }

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      header={
        <div className="p-5 pb-4 pr-14 sm:p-6 sm:pb-4 sm:pr-16">
          <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
            {ETIQUETA_TIPO[item.tipo] ?? item.tipo}
          </p>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            {ETIQUETA_ESTADO[item.estado] ?? item.estado}
            {item.origen === "visita" ? " · Desde pipeline" : " · Actividad de agenda"}
          </p>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 p-4 sm:p-5">
          {modoReagendar ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setModoReagendar(false)}
              >
                Volver
              </Button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                className="w-full sm:w-auto"
                loading={loading}
                onClick={confirmarReagendar}
              >
                Guardar reagendo
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                startIcon={<Icon name="mdi:account-outline" size={16} />}
                onClick={() => {
                  onClose();
                  router.push(`/leads/${item.leadId}`);
                }}
              >
                Ver lead
              </Button>
              {abierta ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    startIcon={<Icon name="mdi:calendar-edit" size={16} />}
                    onClick={abrirReagendar}
                  >
                    Reagendar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    className="w-full sm:w-auto"
                    loading={loading}
                    onClick={() => {
                      if (esActividad) {
                        onActualizarActividad(item.id, {
                          estado: "COMPLETADA",
                          nota: notaCierre.trim() || undefined,
                        });
                      } else {
                        onActualizarVisita(item.id, {
                          estado: "REALIZADA",
                          resultado: "ASISTIO",
                          feedback: notaCierre.trim() || undefined,
                        });
                      }
                    }}
                  >
                    {esActividad ? "Marcar completada" : "Marcar realizada"}
                  </Button>
                  {!esActividad ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      loading={loading}
                      onClick={() =>
                        onActualizarVisita(item.id, {
                          estado: "NO_SHOW",
                          resultado: "NO_SHOW",
                          feedback: notaCierre.trim() || undefined,
                        })
                      }
                    >
                      No show
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    className="w-full sm:w-auto"
                    loading={loading}
                    onClick={() => {
                      if (esActividad) {
                        onActualizarActividad(item.id, {
                          estado: "CANCELADA",
                          nota: notaCierre.trim() || undefined,
                        });
                      } else {
                        onActualizarVisita(item.id, {
                          estado: "CANCELADA",
                          resultado: "CANCELADA",
                          feedback: notaCierre.trim() || undefined,
                        });
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              ) : null}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-3 p-5 pt-4 sm:p-6 sm:pt-4">
        {modoReagendar ? (
          <>
            <div>
              <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                Nueva fecha y hora
              </label>
              <Input
                type="datetime-local"
                value={programadaEn}
                onChange={(e) => setProgramadaEn(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                Duración
              </label>
              <Select options={DURACIONES} value={duracionMinutos} onChange={setDuracionMinutos} />
            </div>
          </>
        ) : (
          <>
            <dl className="space-y-2 text-theme-sm text-gray-700 dark:text-gray-200">
              <div>
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Título</dt>
                <dd>{item.titulo}</dd>
              </div>
              <div>
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Lead</dt>
                <dd>{item.leadNombre ?? "Sin nombre"}</dd>
              </div>
              {item.leadTelefono ? (
                <div>
                  <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Teléfono</dt>
                  <dd>{item.leadTelefono}</dd>
                </div>
              ) : null}
              {item.referenciaInmueble ? (
                <div>
                  <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Inmueble</dt>
                  <dd>
                    {(item.inmueble?.id ?? item.inmuebleId) && crmHabilitado ? (
                      <button
                        type="button"
                        className="text-left font-medium text-brand-600 hover:underline dark:text-brand-400"
                        onClick={() =>
                          router.push(`/inmuebles/${item.inmueble?.id ?? item.inmuebleId}`)
                        }
                      >
                        {item.inmueble
                          ? `${item.inmueble.codigo} — ${item.inmueble.titulo}`
                          : item.referenciaInmueble}
                      </button>
                    ) : (
                      item.referenciaInmueble
                    )}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Cuándo</dt>
                <dd>{formatearFecha(item.programadaEn)}</dd>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div>
                  <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Duración</dt>
                  <dd>{item.duracionMinutos} min</dd>
                </div>
                {item.modalidad ? (
                  <div>
                    <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Modalidad</dt>
                    <dd>{item.modalidad === "VIRTUAL" ? "Virtual" : "Presencial"}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Asesor</dt>
                  <dd>{item.asignado?.nombre ?? "Sin asignar"}</dd>
                </div>
              </div>
              {item.nota ? (
                <div>
                  <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Nota</dt>
                  <dd className="italic">“{item.nota}”</dd>
                </div>
              ) : null}
            </dl>
            {abierta ? (
              <div>
                <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                  Comentario al cerrar (opcional)
                </label>
                <TextArea
                  rows={2}
                  placeholder="Resultado o feedback…"
                  value={notaCierre}
                  onChange={(e) => setNotaCierre(e.target.value)}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}

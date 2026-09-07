"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/src/components/ui/Icon";
import EmptyState from "@/src/components/ui/EmptyState";
import { useOpenTransition } from "@/src/components/ui/use-open-transition";
import { previewUltimoMensaje } from "./preview-ultimo-mensaje";
import type { Mensaje } from "./types";

const TZ = "America/Lima";
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** YYYY-MM-DD en zona America/Lima. */
export function diaLima(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function textoBuscable(mensaje: Mensaje): string {
  const partes: Array<string | null | undefined> = [
    mensaje.texto,
    mensaje.mediaCaption,
    mensaje.mediaNombreArchivo,
    mensaje.plantillaNombre,
    mensaje.ubicacion?.nombre,
    mensaje.ubicacion?.direccion,
    mensaje.interactivo?.cuerpo,
    mensaje.interactivo?.pie,
    ...(mensaje.contactos?.flatMap((c) => [
      c.nombre,
      c.organizacion,
      ...(c.telefonos?.map((t) => t.numero) ?? []),
    ]) ?? []),
    previewUltimoMensaje(mensaje),
  ];
  return partes.filter(Boolean).join(" ").toLowerCase();
}

function previewResultado(mensaje: Mensaje): string {
  return (
    previewUltimoMensaje(mensaje) ??
    mensaje.mediaNombreArchivo?.trim() ??
    "(sin texto)"
  );
}

function formatearHoraResultado(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearTituloMes(anio: number, mes: number) {
  return `${MESES[mes]} de ${anio}`;
}

/** Celdas del mes (lunes primero). `null` = hueco. */
function celdasMes(anio: number, mes: number): Array<number | null> {
  const primero = new Date(Date.UTC(anio, mes, 1));
  // getUTCDay: 0=dom … 6=sáb → lunes=0
  const offset = (primero.getUTCDay() + 6) % 7;
  const dias = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const celdas: Array<number | null> = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= dias; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

function hoyLima(): string {
  return diaLima(new Date().toISOString());
}

export interface ChatBusquedaPanelProps {
  open: boolean;
  onClose: () => void;
  mensajes: Mensaje[];
  nombreContacto: string;
  onIrAlMensaje: (mensajeId: string) => void;
}

export function ChatBusquedaPanel({
  open,
  onClose,
  mensajes,
  nombreContacto,
  onIrAlMensaje,
}: ChatBusquedaPanelProps) {
  const { visible, entered } = useOpenTransition(open, 180);
  const [consulta, setConsulta] = useState("");
  const consultaDeferred = useDeferredValue(consulta);
  const [fecha, setFecha] = useState<string | null>(null);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [vistaMes, setVistaMes] = useState(() => {
    const ahora = new Date();
    return { anio: ahora.getFullYear(), mes: ahora.getMonth() };
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      setConsulta("");
      setFecha(null);
      setCalendarioAbierto(false);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (calendarioAbierto) setCalendarioAbierto(false);
        else onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, calendarioAbierto, onClose]);

  const resultados = useMemo(() => {
    const q = consultaDeferred.trim().toLowerCase();
    if (!q && !fecha) return [];

    return mensajes
      .filter((m) => m.estadoEntrega !== "eliminado")
      .filter((m) => {
        if (fecha && diaLima(m.fechaMensaje) !== fecha) return false;
        if (q && !textoBuscable(m).includes(q)) return false;
        return true;
      })
      .slice()
      .sort((a, b) => new Date(b.fechaMensaje).getTime() - new Date(a.fechaMensaje).getTime());
  }, [mensajes, consultaDeferred, fecha]);

  if (!visible) return null;

  const hayFiltro = Boolean(consulta.trim() || fecha);
  const celdas = celdasMes(vistaMes.anio, vistaMes.mes);
  const hoy = hoyLima();

  return (
    <aside
      ref={panelRef}
      className={`absolute inset-0 z-30 flex h-full min-h-0 w-full flex-col border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 md:static md:z-auto md:w-[360px] md:shrink-0 md:border-l ${
        entered ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0 md:translate-x-8"
      } transition-[opacity,transform] duration-200 ease-out`}
      aria-label="Buscar mensajes"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-3 py-3 dark:border-gray-800">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          aria-label="Cerrar búsqueda"
        >
          <Icon name="mdi:close" size={22} />
        </button>
        <h2 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Buscar mensajes</h2>
      </div>

      <div className="relative shrink-0 border-b border-gray-100 px-3 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCalendarioAbierto((v) => !v);
              if (!calendarioAbierto && fecha) {
                const [y, m] = fecha.split("-").map(Number);
                setVistaMes({ anio: y, mes: m - 1 });
              }
            }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              fecha || calendarioAbierto
                ? "bg-brand-500 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            }`}
            aria-label="Buscar por fecha"
            aria-expanded={calendarioAbierto}
            title="Buscar por fecha"
          >
            <Icon name="mdi:calendar-search" size={22} />
          </button>

          <div className="relative min-w-0 flex-1">
            <Icon
              name="mdi:magnify"
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              type="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Busca"
              aria-label="Buscar por texto"
              className="h-10 w-full rounded-lg border-0 bg-gray-100 py-2 pl-9 pr-8 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500"
            />
            {consulta ? (
              <button
                type="button"
                onClick={() => setConsulta("")}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                aria-label="Limpiar búsqueda"
              >
                <Icon name="mdi:close" size={16} />
              </button>
            ) : null}
          </div>
        </div>

        {fecha ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <Icon name="mdi:calendar" size={14} />
              {new Date(`${fecha}T12:00:00`).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              <button
                type="button"
                onClick={() => setFecha(null)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-500/25"
                aria-label="Quitar filtro de fecha"
              >
                <Icon name="mdi:close" size={12} />
              </button>
            </span>
          </div>
        ) : null}

        {calendarioAbierto ? (
          <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-10 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                aria-label="Mes anterior"
                onClick={() =>
                  setVistaMes((v) =>
                    v.mes === 0 ? { anio: v.anio - 1, mes: 11 } : { anio: v.anio, mes: v.mes - 1 },
                  )
                }
              >
                <Icon name="mdi:chevron-left" size={20} />
              </button>
              <p className="text-theme-sm font-medium capitalize text-gray-800 dark:text-white/90">
                {formatearTituloMes(vistaMes.anio, vistaMes.mes)}
              </p>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                aria-label="Mes siguiente"
                onClick={() =>
                  setVistaMes((v) =>
                    v.mes === 11 ? { anio: v.anio + 1, mes: 0 } : { anio: v.anio, mes: v.mes + 1 },
                  )
                }
              >
                <Icon name="mdi:chevron-right" size={20} />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-gray-400">
              {DIAS_SEMANA.map((d) => (
                <span key={d} className="py-1">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {celdas.map((dia, i) => {
                if (dia == null) return <span key={`e-${i}`} />;
                const valor = `${vistaMes.anio}-${String(vistaMes.mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                const seleccionado = fecha === valor;
                const esHoy = hoy === valor;
                return (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => {
                      setFecha(valor);
                      setCalendarioAbierto(false);
                    }}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-theme-sm transition-colors ${
                      seleccionado
                        ? "bg-brand-500 font-semibold text-white"
                        : esHoy
                          ? "font-semibold text-brand-600 ring-1 ring-brand-500/40 dark:text-brand-400"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
                    }`}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white dark:bg-gray-900">
        {!hayFiltro ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              <Icon name="mdi:magnify" size={28} />
            </div>
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              Busca mensajes por texto o fecha
            </p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon="mdi:magnify-close"
              title="Sin resultados"
              description={
                consulta.trim()
                  ? `No hay mensajes que coincidan con "${consulta.trim()}".`
                  : "No hay mensajes en esa fecha."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {resultados.map((mensaje) => {
              const preview = previewResultado(mensaje);
              const saliente = mensaje.direccion === "saliente";
              return (
                <li key={mensaje.id}>
                  <button
                    type="button"
                    onClick={() => onIrAlMensaje(mensaje.id)}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline justify-between gap-2">
                        <span className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {saliente ? "Tú" : nombreContacto}
                        </span>
                        <span className="shrink-0 text-[11px] text-gray-400">
                          {formatearHoraResultado(mensaje.fechaMensaje)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-theme-xs text-gray-500 dark:text-gray-400">
                        {preview}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

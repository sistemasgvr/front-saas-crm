"use client";

import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { getVisitasLead } from "./queries";
import type { LeadVisitaRow } from "./types";

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const ETIQUETA_ESTADO: Record<string, string> = {
  PROGRAMADA: "Programada",
  REALIZADA: "Realizada",
  NO_SHOW: "No asistió",
  CANCELADA: "Cancelada",
};

export default function LeadVisitasPanel({ leadId }: { leadId: string }) {
  const { data: visitas = [], isLoading } = useQuery({
    queryKey: queryKeys.leadVisitas(leadId),
    queryFn: () => getVisitasLead(leadId),
  });

  const proximas = visitas.filter((v: LeadVisitaRow) => v.estado === "PROGRAMADA");
  const pasadas = visitas.filter((v: LeadVisitaRow) => v.estado !== "PROGRAMADA");

  if (isLoading) {
    return <p className="text-theme-xs text-gray-400">Cargando visitas…</p>;
  }

  if (visitas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-theme-xs text-gray-400 dark:border-gray-800">
        Sin visitas registradas — al agendar desde el pipeline aparecerán aquí y en la agenda.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {proximas.length > 0 && (
        <section>
          <p className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            Próximas visitas
          </p>
          <ul className="space-y-2">
            {proximas.map((v) => (
              <VisitaCard key={v.id} visita={v} destacada />
            ))}
          </ul>
        </section>
      )}
      {pasadas.length > 0 && (
        <section>
          <p className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
            Historial de visitas
          </p>
          <ul className="space-y-2">
            {pasadas.map((v) => (
              <VisitaCard key={v.id} visita={v} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function VisitaCard({ visita, destacada }: { visita: LeadVisitaRow; destacada?: boolean }) {
  return (
    <li
      className={`rounded-xl border p-4 ${
        destacada
          ? "border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-500/5"
          : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900/20"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
            <Icon name="mdi:calendar-clock-outline" size={18} className="shrink-0 text-brand-500" />
            {formatearFecha(visita.programadaEn)}
          </p>
          <p className="mt-1 text-theme-sm text-gray-700 dark:text-gray-200">{visita.referenciaInmueble}</p>
          <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
            {visita.modalidad === "VIRTUAL" ? "Virtual" : "Presencial"}
            {" · "}
            {ETIQUETA_ESTADO[visita.estado] ?? visita.estado}
            {visita.duracionMinutos != null ? ` · ${visita.duracionMinutos} min` : null}
          </p>
          {visita.nota ? (
            <p className="mt-1 text-theme-xs italic text-gray-500 dark:text-gray-400">
              “{visita.nota}”
            </p>
          ) : null}
        </div>
      </div>
      {visita.feedback && (
        <p className="mt-2 text-theme-xs italic text-gray-500 dark:text-gray-400">"{visita.feedback}"</p>
      )}
    </li>
  );
}

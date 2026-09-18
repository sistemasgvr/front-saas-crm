"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Badge from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { listarLlamadas } from "./queries";
import {
  etiquetaResultado,
  formatearDuracionSeg,
} from "./types";

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface LeadLlamadasPanelProps {
  leadId: string;
  conversacionId?: string | null;
}

export default function LeadLlamadasPanel({
  leadId,
  conversacionId: conversacionIdProp,
}: LeadLlamadasPanelProps) {
  const query = useQuery({
    queryKey: queryKeys.whatsappCallsList({ leadId }),
    queryFn: () => listarLlamadas({ leadId, page: 1 }),
    staleTime: 20_000,
  });

  const items = query.data?.items ?? [];
  const conversacionId =
    conversacionIdProp ??
    items.find((l) => l.conversacionId)?.conversacionId ??
    null;

  return (
    <div className="space-y-3">
      {conversacionId ? (
        <Link
          href={`/chats/${conversacionId}`}
          className="inline-flex items-center gap-1.5 text-theme-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          <Icon name="mdi:phone" size={16} />
          Ir al chat para llamar
        </Link>
      ) : (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Inicia un chat con este lead para poder llamar por WhatsApp.
        </p>
      )}

      {query.isLoading ? (
        <p className="text-theme-sm text-gray-400">Cargando llamadas…</p>
      ) : items.length === 0 ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Todavía no hay llamadas registradas para este lead.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.slice(0, 8).map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-theme-sm text-gray-700 dark:text-gray-200">
                  <Icon
                    name={
                      l.direccion === "SALIENTE"
                        ? "mdi:phone-outgoing"
                        : "mdi:phone-incoming"
                    }
                    size={16}
                    className="shrink-0 text-gray-400"
                  />
                  {l.direccion === "SALIENTE" ? "Saliente" : "Entrante"}
                  <span className="text-gray-400">·</span>
                  {formatearDuracionSeg(l.duracionSeg)}
                </p>
                <p className="text-theme-xs text-gray-400">{formatearFecha(l.inicioEn)}</p>
              </div>
              <Badge
                color={
                  (l.resultado ?? "").toUpperCase() === "CONTESTADA"
                    ? "success"
                    : "light"
                }
                size="sm"
              >
                {etiquetaResultado(l.resultado, l.estado)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { listarLlamadas } from "./queries";
import {
  etiquetaResultado,
  formatearDuracionSeg,
  type WhatsappLlamada,
} from "./types";

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function textoBurbuja(l: WhatsappLlamada): string {
  const dir = l.direccion === "SALIENTE" ? "saliente" : "entrante";
  const res = etiquetaResultado(l.resultado, l.estado);
  const dur = l.duracionSeg != null ? ` · ${formatearDuracionSeg(l.duracionSeg)}` : "";
  const quien = l.asignadoNombre ? ` · ${l.asignadoNombre}` : "";
  return `Llamada ${dir} · ${res}${dur}${quien}`;
}

interface ChatLlamadasStripProps {
  conversacionId: string;
}

export default function ChatLlamadasStrip({ conversacionId }: ChatLlamadasStripProps) {
  const query = useQuery({
    queryKey: queryKeys.whatsappCallsList({ conversacionId }),
    queryFn: () => listarLlamadas({ conversacionId, page: 1 }),
    staleTime: 15_000,
  });

  const items = (query.data?.items ?? []).slice(0, 5);
  if (!query.isSuccess || items.length === 0) return null;

  return (
    <div className="mb-3 space-y-1.5 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Llamadas recientes
        </p>
        <Link
          href="/llamadas"
          className="text-theme-xs text-brand-600 hover:underline dark:text-brand-400"
        >
          Ver todas
        </Link>
      </div>
      <ul className="space-y-1">
        {items.map((l) => (
          <li
            key={l.id}
            className="flex items-start gap-2 text-theme-xs text-gray-600 dark:text-gray-300"
          >
            <Icon
              name={l.direccion === "SALIENTE" ? "mdi:phone-outgoing" : "mdi:phone-incoming"}
              size={14}
              className="mt-0.5 shrink-0 text-gray-400"
            />
            <span className="min-w-0 flex-1">
              <span className="block">{textoBurbuja(l)}</span>
              <span className="text-gray-400">{formatearHora(l.inicioEn)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import InmuebleSelect from "@/src/modules/inmuebles/InmuebleSelect";
import { gestionarLeadAction } from "@/src/modules/leads/actions";
import type { InmuebleInteresResumen } from "./types";

function etiquetaInmueble(inmueble: InmuebleInteresResumen) {
  return `${inmueble.codigo} — ${inmueble.titulo}`;
}

/**
 * Chip compacto en el header del chat: enlace al inmueble de interés del lead
 * o CTA “Asignar inmueble” con InmuebleSelect + PATCH gestión.
 */
export default function ChatLeadInmuebleChip({
  leadId,
  conversacionId,
  inmuebleInteres,
}: {
  leadId: string;
  conversacionId: string;
  inmuebleInteres: InmuebleInteresResumen | null;
}) {
  const [asignando, setAsignando] = useState(false);
  const [inmuebleId, setInmuebleId] = useState("");
  const [referencia, setReferencia] = useState("");

  const guardar = useAppMutation({
    mutationFn: (nextId: string) =>
      gestionarLeadAction(leadId, { inmuebleInteresId: nextId }),
    successMessage: "Inmueble de interés asignado",
    invalidateKeys: [
      queryKeys.whatsappChat(conversacionId),
      queryKeys.whatsappChats,
      queryKeys.lead(leadId),
      queryKeys.leadsAll,
    ],
  });

  function cancelar() {
    setAsignando(false);
    setInmuebleId("");
    setReferencia("");
  }

  if (inmuebleInteres) {
    return (
      <Link
        href={`/inmuebles/${inmuebleInteres.id}`}
        title={etiquetaInmueble(inmuebleInteres)}
        className="inline-flex max-w-full items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
      >
        <Icon name="mdi:home-outline" size={14} className="shrink-0" />
        <span className="truncate">Inmueble: {etiquetaInmueble(inmuebleInteres)}</span>
      </Link>
    );
  }

  if (asignando) {
    return (
      <div className="mt-1 w-full max-w-sm space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-white/5">
        <InmuebleSelect
          inmuebleId={inmuebleId}
          referencia={referencia}
          disabled={guardar.isPending}
          onChange={({ inmuebleId: nextId, referencia: nextRef }) => {
            setInmuebleId(nextId);
            setReferencia(nextRef);
          }}
        />
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            loading={guardar.isPending}
            disabled={!inmuebleId}
            onClick={() =>
              guardar.mutate(inmuebleId, { onSuccess: () => setAsignando(false) })
            }
          >
            Guardar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={guardar.isPending}
            onClick={cancelar}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAsignando(true)}
      className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-2 py-0.5 text-theme-xs font-medium text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
    >
      <Icon name="mdi:home-plus-outline" size={14} className="shrink-0" />
      Asignar inmueble
    </button>
  );
}

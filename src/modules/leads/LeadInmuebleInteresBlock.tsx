"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import InmuebleSelect from "@/src/modules/inmuebles/InmuebleSelect";
import { gestionarLeadAction } from "./actions";
import type { InmuebleResumenCorto } from "./types";

function etiquetaInmueble(inmueble: InmuebleResumenCorto) {
  return `${inmueble.codigo} — ${inmueble.titulo}`;
}

/** Bloque “Inmueble de interés” en ficha lead — lectura + editor con InmuebleSelect. */
export default function LeadInmuebleInteresBlock({
  leadId,
  inmuebleInteres,
  puedeGestionar,
  crmHabilitado,
}: {
  leadId: string;
  inmuebleInteres: InmuebleResumenCorto | null;
  puedeGestionar: boolean;
  crmHabilitado: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [inmuebleId, setInmuebleId] = useState(inmuebleInteres?.id ?? "");
  const [referencia, setReferencia] = useState(
    inmuebleInteres ? etiquetaInmueble(inmuebleInteres) : "",
  );

  const guardar = useAppMutation({
    mutationFn: (nextId: string | null) =>
      gestionarLeadAction(leadId, { inmuebleInteresId: nextId }),
    successMessage: "Inmueble de interés actualizado",
    invalidateKeys: [queryKeys.lead(leadId), queryKeys.leadsAll],
  });

  function abrirEditor() {
    setInmuebleId(inmuebleInteres?.id ?? "");
    setReferencia(inmuebleInteres ? etiquetaInmueble(inmuebleInteres) : "");
    setEditando(true);
  }

  function cancelar() {
    setEditando(false);
    setInmuebleId(inmuebleInteres?.id ?? "");
    setReferencia(inmuebleInteres ? etiquetaInmueble(inmuebleInteres) : "");
  }

  function persistir(nextId: string | null) {
    guardar.mutate(nextId, { onSuccess: () => setEditando(false) });
  }

  return (
    <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
          <Icon name="mdi:home-city-outline" size={18} className="shrink-0 text-brand-500" />
          Inmueble de interés
        </p>
        {puedeGestionar && !editando ? (
          <Button type="button" size="sm" variant="outline" onClick={abrirEditor}>
            {inmuebleInteres ? "Cambiar" : "Asignar"}
          </Button>
        ) : null}
      </div>

      {editando ? (
        <div className="space-y-3">
          <InmuebleSelect
            inmuebleId={inmuebleId}
            referencia={referencia}
            disabled={guardar.isPending}
            onChange={({ inmuebleId: nextId, referencia: nextRef }) => {
              setInmuebleId(nextId);
              setReferencia(nextRef);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              loading={guardar.isPending}
              disabled={!inmuebleId || inmuebleId === inmuebleInteres?.id}
              onClick={() => persistir(inmuebleId)}
            >
              Guardar
            </Button>
            {inmuebleInteres ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={guardar.isPending}
                onClick={() => persistir(null)}
              >
                Quitar
              </Button>
            ) : null}
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
      ) : inmuebleInteres ? (
        <div className="min-w-0">
          {crmHabilitado ? (
            <Link
              href={`/inmuebles/${inmuebleInteres.id}`}
              className="inline-flex max-w-full items-center gap-1.5 text-theme-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              <Icon name="mdi:home-outline" size={16} className="shrink-0" />
              <span className="truncate">{etiquetaInmueble(inmuebleInteres)}</span>
            </Link>
          ) : (
            <p className="text-theme-sm text-gray-700 dark:text-gray-200">
              {etiquetaInmueble(inmuebleInteres)}
            </p>
          )}
        </div>
      ) : (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin inmueble vinculado</p>
      )}
    </div>
  );
}

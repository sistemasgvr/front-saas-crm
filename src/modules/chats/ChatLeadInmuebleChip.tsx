"use client";

import { useEffect, useState } from "react";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import Modal from "@/src/components/ui/modal/Modal";
import { queryKeys } from "@/src/lib/query/keys";
import { unwrapAction } from "@/src/lib/action-result";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import InmuebleSelect from "@/src/modules/inmuebles/InmuebleSelect";
import type { InmuebleInteresResumen } from "./types";
import { gestionarLeadAction } from "@/src/modules/leads/actions";

function etiquetaInmueble(inmueble: InmuebleInteresResumen) {
  return `${inmueble.codigo} — ${inmueble.titulo}`;
}

/**
 * Icono / modal para asignar el inmueble de interés del lead del chat.
 * Puede controlarse desde fuera (menú ⋮ en mobile) con `open` + `onOpenChange`.
 */
export default function ChatLeadInmuebleChip({
  leadId,
  conversacionId,
  inmuebleInteres,
  open: openControlado,
  onOpenChange,
  showTrigger = true,
  triggerClassName,
}: {
  leadId: string;
  conversacionId: string;
  inmuebleInteres: InmuebleInteresResumen | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerClassName?: string;
}) {
  const [openInterno, setOpenInterno] = useState(false);
  const controlado = openControlado !== undefined;
  const modalAbierto = controlado ? openControlado : openInterno;
  const [inmuebleId, setInmuebleId] = useState("");
  const [referencia, setReferencia] = useState("");

  function setModalAbierto(next: boolean) {
    if (!controlado) setOpenInterno(next);
    onOpenChange?.(next);
  }

  const guardar = useAppMutation({
    mutationFn: async (nextId: string | null) =>
      unwrapAction(await gestionarLeadAction(leadId, { inmuebleInteresId: nextId })),
    successMessage: inmuebleInteres
      ? "Inmueble de interés actualizado"
      : "Inmueble de interés asignado",
    invalidateKeys: [
      queryKeys.whatsappChat(conversacionId),
      queryKeys.whatsappChats,
      queryKeys.lead(leadId),
      queryKeys.leadsAll,
    ],
  });

  useEffect(() => {
    if (!modalAbierto) return;
    setInmuebleId(inmuebleInteres?.id ?? "");
    setReferencia(inmuebleInteres ? etiquetaInmueble(inmuebleInteres) : "");
  }, [modalAbierto, inmuebleInteres]);

  function cerrar() {
    if (guardar.isPending) return;
    setModalAbierto(false);
  }

  const titulo = inmuebleInteres
    ? `Inmueble: ${etiquetaInmueble(inmuebleInteres)}`
    : "Asignar inmueble";

  return (
    <>
      {showTrigger ? (
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className={
            triggerClassName ??
            `flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              inmuebleInteres
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            }`
          }
          aria-label={titulo}
          title={titulo}
        >
          <Icon
            name={inmuebleInteres ? "mdi:home-outline" : "mdi:home-plus-outline"}
            size={22}
          />
        </button>
      ) : null}

      <Modal
        open={modalAbierto}
        onClose={cerrar}
        header={
          <div className="flex items-start gap-3 px-5 py-4 pr-12">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Icon name="mdi:home-city-outline" size={22} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                {inmuebleInteres ? "Cambiar inmueble" : "Asignar inmueble"}
              </h3>
              <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                Inmueble de interés del lead vinculado a este chat.
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex flex-wrap justify-end gap-2 px-5 py-3">
            <Button type="button" variant="outline" size="sm" onClick={cerrar} disabled={guardar.isPending}>
              Cancelar
            </Button>
            {inmuebleInteres ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={guardar.isPending}
                onClick={() =>
                  guardar.mutate(null, { onSuccess: () => setModalAbierto(false) })
                }
              >
                Quitar
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              loading={guardar.isPending}
              disabled={!inmuebleId || inmuebleId === inmuebleInteres?.id}
              onClick={() =>
                guardar.mutate(inmuebleId, { onSuccess: () => setModalAbierto(false) })
              }
            >
              Guardar
            </Button>
          </div>
        }
      >
        <div className="px-5 py-4">
          <InmuebleSelect
            inmuebleId={inmuebleId}
            referencia={referencia}
            disabled={guardar.isPending}
            onChange={({ inmuebleId: nextId, referencia: nextRef }) => {
              setInmuebleId(nextId);
              setReferencia(nextRef);
            }}
          />
        </div>
      </Modal>
    </>
  );
}

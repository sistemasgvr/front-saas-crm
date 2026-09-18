"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Badge from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";
import { Spinner } from "@/src/components/ui/Spinner";
import { DropdownItem } from "@/src/components/ui/dropdown/DropdownItem";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { solicitarPermisoLlamadaAction } from "./actions";
import { iniciarLlamadaSalienteDesdeUi } from "./CallProvider";
import { getCapacidadCalling, getPermisoLlamada } from "./queries";

function badgePermiso(status?: string | null, puede?: boolean) {
  if (puede) {
    const upper = (status ?? "").toUpperCase();
    if (upper === "TEMPORARY") {
      return { color: "warning" as const, label: "Permiso temporal" };
    }
    return { color: "success" as const, label: "Puede llamar" };
  }
  return { color: "light" as const, label: "Sin permiso" };
}

interface ChatCallControlsProps {
  conversacionId: string;
  nombreContacto?: string | null;
  waId?: string | null;
  leadId?: string | null;
  /** Render desktop icon button */
  variant?: "icon" | "menu";
  onMenuClose?: () => void;
}

export function ChatCallControls({
  conversacionId,
  nombreContacto,
  waId,
  leadId,
  variant = "icon",
  onMenuClose,
}: ChatCallControlsProps) {
  const [llamando, setLlamando] = useState(false);

  const capacidadQuery = useQuery({
    queryKey: queryKeys.whatsappCallCapacidad,
    queryFn: getCapacidadCalling,
    staleTime: 60_000,
  });

  const permisoQuery = useQuery({
    queryKey: queryKeys.whatsappCallPermiso(conversacionId),
    queryFn: () => getPermisoLlamada({ conversacionId }),
    enabled: Boolean(capacidadQuery.data?.disponible),
    staleTime: 30_000,
  });

  const solicitar = useAppMutation({
    mutationFn: () => solicitarPermisoLlamadaAction({ conversacionId }),
    successMessage: "Solicitud de permiso enviada",
    invalidateKeys: [queryKeys.whatsappCallPermiso(conversacionId)],
    silent: true,
  });

  const capacidad = capacidadQuery.data;
  if (!capacidad?.disponible && !capacidad?.tieneLineaCalling) {
    return null;
  }
  if (!capacidad?.disponible) {
    return null;
  }

  const permiso = permisoQuery.data;
  const badge = badgePermiso(permiso?.status, permiso?.puedeLlamar);
  const puedeLlamar = Boolean(permiso?.puedeLlamar);

  const llamar = async () => {
    onMenuClose?.();
    setLlamando(true);
    try {
      await iniciarLlamadaSalienteDesdeUi({
        conversacionId,
        nombreContacto,
        waId,
        leadId,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar la llamada");
    } finally {
      setLlamando(false);
    }
  };

  if (variant === "menu") {
    return (
      <>
        {puedeLlamar ? (
          <DropdownItem
            onClick={() => void llamar()}
            className="flex items-center gap-2.5 px-3 py-2.5 text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <Icon name="mdi:phone" size={18} className="text-gray-500" />
            {llamando ? "Llamando…" : "Llamar por WhatsApp"}
          </DropdownItem>
        ) : (
          <DropdownItem
            onClick={() => {
              onMenuClose?.();
              solicitar.mutate();
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <Icon name="mdi:phone-plus" size={18} className="text-gray-500" />
            Pedir permiso de llamada
          </DropdownItem>
        )}
      </>
    );
  }

  return (
    <div className="hidden items-center gap-1 md:flex">
      <span className="sr-only" aria-live="polite">
        {badge.label}
      </span>
      {puedeLlamar ? (
        <button
          type="button"
          disabled={llamando}
          onClick={() => void llamar()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-success-600 transition-colors hover:bg-success-500/10 disabled:opacity-50 dark:text-success-400 dark:hover:bg-success-500/15"
          aria-label="Llamar por WhatsApp"
          title={`Llamar · ${badge.label}`}
        >
          {llamando ? <Spinner size={18} /> : <Icon name="mdi:phone" size={22} />}
        </button>
      ) : (
        <button
          type="button"
          disabled={solicitar.isPending || permisoQuery.isLoading}
          onClick={() => solicitar.mutate()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5"
          aria-label="Pedir permiso de llamada"
          title="Pedir permiso de llamada"
        >
          {solicitar.isPending ? (
            <Spinner size={18} />
          ) : (
            <Icon name="mdi:phone-plus" size={22} />
          )}
        </button>
      )}
      {!permisoQuery.isLoading ? (
        <Badge color={badge.color} size="sm" className="hidden lg:inline-flex">
          {badge.label}
        </Badge>
      ) : null}
    </div>
  );
}

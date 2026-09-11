"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ActionButton from "@/src/components/ui/ActionButton";
import Badge from "@/src/components/ui/badge/Badge";
import EmptyState from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import MetaLinkResourcePanel from "../meta/MetaLinkResourcePanel";
import WhatsappTemplatesPanel from "./WhatsappTemplatesPanel";
import {
  linkWhatsappNumeroAction,
  resyncWhatsappWebhookAction,
  unlinkWhatsappNumeroAction,
  verificarWhatsappWebhookAction,
} from "./actions";
import { getWhatsappConexiones, getWhatsappNumerosDisponibles } from "./queries";
import type { WhatsappConexion } from "./types";

const INVALIDATE = [queryKeys.whatsappConexiones, queryKeys.whatsappNumerosDisponibles];

const AVISO_CAMPOS_META =
  "En Meta Developers → Webhooks → WhatsApp Business Account: messages, history, smb_message_echoes, smb_app_state_sync";

function UnlinkAction({ id }: { id: string }) {
  const mutation = useAppMutation({
    mutationFn: () => unlinkWhatsappNumeroAction(id),
    successMessage: "Número desvinculado",
    invalidateKeys: INVALIDATE,
  });
  return <TableAction icon="mdi:link-off" label="Desvincular" variant="danger" onClick={() => mutation.mutate()} />;
}

function ConexionWebhookActions({
  conexion,
  onCamposFaltantes,
}: {
  conexion: WhatsappConexion;
  onCamposFaltantes: (campos: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ActionButton
        action={async () => {
          const resultado = await resyncWhatsappWebhookAction(conexion.id);
          onCamposFaltantes(resultado.camposFaltantes);
        }}
        successMessage="Webhook re-suscrito"
        loadingText="Re-suscribiendo…"
        invalidateKeys={INVALIDATE}
        startIcon={<Icon name="mdi:refresh" size={18} />}
      >
        Re-suscribir webhook
      </ActionButton>
      <ActionButton
        action={async () => {
          const resultado = await verificarWhatsappWebhookAction(conexion.id);
          onCamposFaltantes(resultado.camposFaltantes);
        }}
        successMessage="Verificación completada"
        loadingText="Verificando…"
        variant="outline"
        invalidateKeys={INVALIDATE}
        startIcon={<Icon name="mdi:shield-check-outline" size={18} />}
      >
        Verificar
      </ActionButton>
      <UnlinkAction id={conexion.id} />
    </div>
  );
}

export default function WhatsappSettingsView() {
  const [camposFaltantesPorId, setCamposFaltantesPorId] = useState<Record<string, string[]>>({});

  const conexionesQuery = useQuery({
    queryKey: queryKeys.whatsappConexiones,
    queryFn: getWhatsappConexiones,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Vincula el número de WhatsApp Business de la organización para chatear con tus leads."
        backHref="/settings"
        backLabel="Volver a Configuración"
      />

      <MetaLinkResourcePanel
        title="Vincular número de WhatsApp"
        icon="mdi:whatsapp"
        loadingLabel="Buscando números disponibles…"
        emptyMessage="No hay números nuevos por vincular — verifica que el WABA esté conectado a tu Meta App"
        queryKey={queryKeys.whatsappNumerosDisponibles}
        queryFn={async () => {
          const numeros = await getWhatsappNumerosDisponibles();
          return numeros.map((n) => ({
            id: n.phoneNumberId,
            nombre: `${n.displayPhoneNumber} — ${n.verifiedName}`,
          }));
        }}
        onLink={async (item) => {
          const numeros = await getWhatsappNumerosDisponibles();
          const numero = numeros.find((n) => n.phoneNumberId === item.id);
          if (!numero) return;
          await linkWhatsappNumeroAction(
            numero.wabaId,
            numero.phoneNumberId,
            numero.displayPhoneNumber,
            numero.verifiedName,
          );
        }}
        successMessage="Número de WhatsApp vinculado"
        invalidateKeys={INVALIDATE}
      />

      {conexionesQuery.isLoading ? (
        <PageLoader />
      ) : conexionesQuery.isError ? (
        <QueryError error={conexionesQuery.error} />
      ) : conexionesQuery.data && conexionesQuery.data.length === 0 ? (
        <EmptyState
          icon="mdi:whatsapp"
          title="Sin número vinculado"
          description="Vincula un número arriba para empezar a chatear con tus leads."
        />
      ) : (
        <div className="space-y-3">
          {(conexionesQuery.data ?? []).map((conexion) => {
            const faltantes = camposFaltantesPorId[conexion.id] ?? [];
            return (
              <div
                key={conexion.id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
                    <Icon name="mdi:whatsapp" size={22} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {conexion.numeroDisplay ?? conexion.phoneNumberId}
                      </p>
                      <Badge color={conexion.webhookSuscrito ? "success" : "warning"} size="sm">
                        {conexion.webhookSuscrito ? "Webhook activo" : "Webhook sin confirmar"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400">
                      {conexion.nombreVerificado ?? "Sin nombre verificado"}
                    </p>
                    {conexion.webhookUltimoError && (
                      <p className="mt-0.5 text-theme-xs text-error-500">{conexion.webhookUltimoError}</p>
                    )}
                    {faltantes.length > 0 && (
                      <p className="mt-1 text-theme-xs text-warning-600 dark:text-warning-400">
                        Campos faltantes: {faltantes.join(", ")}. {AVISO_CAMPOS_META}
                      </p>
                    )}
                  </div>
                </div>
                <ConexionWebhookActions
                  conexion={conexion}
                  onCamposFaltantes={(campos) =>
                    setCamposFaltantesPorId((prev) => ({ ...prev, [conexion.id]: campos }))
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <WhatsappTemplatesPanel />
    </div>
  );
}

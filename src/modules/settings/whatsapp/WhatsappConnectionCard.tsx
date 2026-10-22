"use client";

import { useQuery } from "@tanstack/react-query";
import ActionButton from "@/src/components/ui/ActionButton";
import Badge from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";
import TableAction from "@/src/components/ui/TableAction";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import CallingSettingsPanel from "@/src/modules/calls/CallingSettingsPanel";
import { resyncWhatsappWebhookAction, unlinkWhatsappNumeroAction, verificarWhatsappWebhookAction } from "./actions";
import type { WhatsappConexion } from "./types";
import WhatsappEstadoConexion from "./WhatsappEstadoConexion";

const estados: Record<string, string> = { CONNECTED: "Conectado", DISCONNECTED: "Desconectado", PENDING: "Pendiente", BANNED: "Suspendido", RESTRICTED: "Restringido", UNVERIFIED: "Sin verificar", DELETED: "Eliminado", MIGRATED: "Migrado" };

export default function WhatsappConnectionCard({ conexion }: { conexion: WhatsappConexion }) {
  const salud = useQuery({
    queryKey: ["whatsapp", "connection-health", conexion.id],
    queryFn: () => verificarWhatsappWebhookAction(conexion.id),
    staleTime: 60_000,
    retry: false,
  });
  // Ante una consulta fallida no presentamos el resultado anterior como vigente.
  const resultado = salud.isError ? undefined : salud.data;
  // Sin consulta viva todavía, se usa lo último que avisó Meta por webhook
  // (account_update: coexistencia desconectada/reconectada).
  const estado = resultado?.numero?.estado ?? (salud.isFetching || salud.isError ? undefined : conexion.estadoNumero ?? undefined);
  const unlink = useAppMutation({
    mutationFn: () => unlinkWhatsappNumeroAction(conexion.id),
    successMessage: "Número desvinculado",
    invalidateKeys: [queryKeys.whatsappConexiones, queryKeys.whatsappNumerosDisponibles],
  });
  const verificar = async () => {
    const chequeo = await salud.refetch();
    if (chequeo.error) throw chequeo.error;
    const data = chequeo.data;
    if (!data) throw new Error("No se pudo comprobar la conexión");
    if (data.numero?.estado === "DISCONNECTED") throw new Error("Meta reporta el número desconectado. Revisa la vinculación con la plataforma empresarial en WhatsApp Business.");
    if (data.webhookUltimoError) throw new Error(data.webhookUltimoError);
    if (!data.numero?.estado) throw new Error("No se pudo verificar el estado del número en Meta");
    if (data.numero.estado !== "CONNECTED") throw new Error(`Estado del número en Meta: ${estados[data.numero.estado] ?? data.numero.estado}`);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"><Icon name="mdi:whatsapp" size={22} /></span>
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">{conexion.numeroDisplay ?? conexion.phoneNumberId}</p>
            <p className="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400">{conexion.nombreVerificado ?? "Sin nombre verificado"}</p>
            <div className="mt-2 flex flex-wrap gap-2" aria-live="polite">
              <Badge color={resultado?.webhookSuscrito === false ? "error" : "light"} size="sm">
                {resultado?.webhookSuscrito === true ? "App suscrita al WABA" : resultado?.webhookSuscrito === false ? "App sin suscripción al WABA" : "Suscripción sin verificar"}
              </Badge>
              <Badge color={!estado ? "light" : estado === "CONNECTED" ? "success" : "error"} size="sm">
                {estado ? `Número en Meta: ${estados[estado] ?? estado}` : "Número sin verificar"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ActionButton action={async () => { await resyncWhatsappWebhookAction(conexion.id); await salud.refetch(); }} successMessage="Suscripción de la app actualizada" loadingText="Re-suscribiendo…" invalidateKeys={[queryKeys.whatsappConexiones]} startIcon={<Icon name="mdi:refresh" size={18} />}>
            Re-suscribir webhook
          </ActionButton>
          <ActionButton action={verificar} successMessage="Estado consultado en Meta; comprueba la recepción con un mensaje real" loadingText="Verificando…" variant="outline" startIcon={<Icon name="mdi:shield-check-outline" size={18} />}>
            Verificar conexión
          </ActionButton>
          <TableAction icon="mdi:link-off" label="Desvincular" variant="danger" onClick={() => unlink.mutate()} />
        </div>
      </div>

      <WhatsappEstadoConexion
        resultado={resultado}
        consultando={salud.isFetching}
        fallo={salud.isError}
        rolLinea={conexion.rolLinea}
      />
      <CallingSettingsPanel conexion={conexion} />
    </div>
  );
}

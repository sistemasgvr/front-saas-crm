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

const fecha = (value: string) => new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
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
  const estado = resultado?.numero?.estado;
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
              {salud.isFetching && <span className="text-theme-xs text-gray-500">Consultando Meta…</span>}
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

      <div className="mt-4 space-y-2 text-theme-xs">
        {salud.isError && <p role="alert" className="text-error-600">No se pudo consultar Meta. El estado actual de la conexión no está verificado.</p>}
        {estado === "DISCONNECTED" && <p role="alert" className="rounded-lg bg-error-50 p-3 text-error-700 dark:bg-error-500/10 dark:text-error-400">Meta reporta esta línea desconectada. Revisa la conexión con la plataforma empresarial en WhatsApp Business y restablece la vinculación de coexistencia si corresponde. Re-suscribir el webhook no reconecta el número.</p>}
        {resultado?.erroresVerificacion?.map((error) => <p key={error} className="text-warning-600 dark:text-warning-400">{error}</p>)}
        {resultado?.suscripcionAppActiva === false && <p className="text-error-600">La suscripción de WhatsApp de la app no está activa en Meta Developers.</p>}
        {!!resultado?.camposFaltantes.length && <p className="text-warning-600 dark:text-warning-400">En Meta Developers → Webhooks → WhatsApp Business Account, suscribe los campos faltantes: {resultado.camposFaltantes.join(", ")}.</p>}
        {resultado && !resultado.camposVerificados && <p className="text-gray-500">Los campos del webhook no se pudieron comprobar.</p>}
        {resultado?.numero?.saludEnvio === "BLOCKED" && <p className="font-medium text-warning-600 dark:text-warning-400">Meta reporta el envío bloqueado. Este estado se comprueba por separado de la recepción.</p>}
        {resultado?.erroresEnvio?.map((error, index) => <p key={`${error.codigo}-${index}`} className="text-warning-600 dark:text-warning-400">{error.codigo === 141006 ? "141006: Revisa el método de pago del WABA en Meta." : error.codigo === 141007 ? "141007: Configura la zona horaria del WABA en Meta." : `${error.codigo ?? "Meta"}: ${error.descripcion}`}</p>)}
        <p className="text-gray-500 dark:text-gray-400">Último mensaje entrante guardado: {resultado?.ultimoMensajeEntranteEn ? `${fecha(resultado.ultimoMensajeEntranteEn)} (Lima)` : resultado ? "Sin fecha disponible" : "Sin verificar"}.</p>
        {resultado?.verificadoEn && <p className="text-gray-500 dark:text-gray-400">Consulta a Meta: {fecha(resultado.verificadoEn)} (Lima). {resultado.numero?.plataforma && `Plataforma: ${resultado.numero.plataforma}.`}</p>}
        <p className="text-gray-500 dark:text-gray-400">La suscripción y el estado del número no confirman la entrega de eventos. Comprueba la recepción enviando un mensaje real y revisando los logs del backend.</p>
      </div>
      <CallingSettingsPanel conexion={conexion} />
    </div>
  );
}

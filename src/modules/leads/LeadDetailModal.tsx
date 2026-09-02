"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import Modal from "@/src/components/ui/modal/Modal";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { canManageOrganization } from "@/src/lib/roles";
import { iniciarChatDesdeLeadAction } from "@/src/modules/chats/actions";
import LeadAssignmentActions from "./LeadAssignmentActions";
import LeadPipelinePanel from "./LeadPipelinePanel";
import { getLead } from "./queries";

type Rol = "PROPIETARIO" | "ADMINISTRADOR" | "USUARIO" | null;

function formatearFecha(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Vista rápida del lead sin salir del tablero — mismo `LeadPipelinePanel`
 * que usa la ficha completa, así que es igual de interactuable (clasificar
 * tipo, avanzar de etapa, cerrar, reabrir, ver historial) sin navegar. Las
 * secciones más pesadas (respuestas del formulario, origen publicitario,
 * visitas) se quedan en la ficha completa — acá hay un link directo.
 */
export default function LeadDetailModal({
  leadId,
  open,
  onClose,
  rol,
  usuarioId,
  whatsappHabilitado,
}: {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
  rol: Rol;
  usuarioId: string;
  whatsappHabilitado: boolean;
}) {
  const router = useRouter();
  const leadQuery = useQuery({
    queryKey: queryKeys.lead(leadId ?? ""),
    queryFn: () => getLead(leadId as string),
    enabled: open && Boolean(leadId),
  });
  const iniciarChat = useAppMutation({
    mutationFn: () => iniciarChatDesdeLeadAction(leadId as string),
  });

  const lead = leadQuery.data;
  const nombre = lead?.nombre ?? "Sin nombre";
  const cargado = !leadQuery.isLoading && !leadQuery.isError && Boolean(lead);

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-2xl"
      header={
        cargado && lead ? (
          <div className="flex flex-wrap items-start gap-4 p-5 pr-14 sm:p-6 sm:pr-16">
            <Avatar name={nombre} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-gray-800 dark:text-white/90">{nombre}</h2>
              <div className="mt-1.5 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4">
                <span className="inline-flex items-center gap-1.5 text-theme-xs text-gray-600 dark:text-gray-300">
                  <Icon name="mdi:email-outline" size={14} className="shrink-0 text-gray-400" />
                  {lead.email ?? "Sin email"}
                </span>
                {lead.telefono ? (
                  <span className="inline-flex items-center gap-1.5 text-theme-xs text-gray-600 dark:text-gray-300">
                    <Icon name="mdi:phone-outline" size={14} className="shrink-0 text-gray-400" />
                    {lead.telefono}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                  <Icon name="mdi:calendar-clock-outline" size={14} className="shrink-0" />
                  {formatearFecha(lead.fechaLead)}
                </span>
              </div>
            </div>
          </div>
        ) : undefined
      }
      footer={
        cargado ? (
          <Link
            href={`/leads/${leadId}`}
            className="flex items-center justify-center gap-1 px-5 py-3 text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Ver ficha completa (respuestas del formulario, origen, visitas)
            <Icon name="mdi:chevron-right" size={16} />
          </Link>
        ) : undefined
      }
    >
      <div className="p-5 sm:p-6">
        {leadQuery.isLoading ? (
          <PageLoader />
        ) : leadQuery.isError ? (
          <QueryError error={leadQuery.error} />
        ) : !lead ? null : (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {lead.asignado ? (
                  <span className="inline-flex items-center gap-1.5 text-theme-xs text-gray-700 dark:text-gray-200">
                    <Icon name="mdi:account-check-outline" size={14} className="shrink-0 text-success-500" />
                    Asignado a <span className="font-medium">{lead.asignado.nombre}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-theme-xs text-warning-500">
                    <Icon name="mdi:account-question-outline" size={14} className="shrink-0" />
                    Sin asignar
                  </span>
                )}
                <LeadAssignmentActions leadId={leadId as string} asignado={lead.asignado} rol={rol} />
              </div>

              <span
                title={
                  !whatsappHabilitado
                    ? "Activa el módulo WhatsApp en Configuración"
                    : !lead.telefono
                      ? "Este lead no tiene teléfono registrado"
                      : undefined
                }
              >
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!whatsappHabilitado || !lead.telefono}
                  loading={iniciarChat.isPending}
                  startIcon={<Icon name="mdi:whatsapp" size={16} />}
                  onClick={() =>
                    iniciarChat.mutate(undefined, {
                      onSuccess: (resultado) => router.push(`/chats/${resultado.conversacionId}`),
                    })
                  }
                >
                  Iniciar chat
                </Button>
              </span>
            </div>

            <div className="border-t border-gray-100 pt-5 dark:border-gray-800">
              <LeadPipelinePanel
                leadId={leadId as string}
                tipoLead={lead.tipoLead}
                estadoGestion={lead.estadoGestion}
                estadoGestionEn={lead.estadoGestionEn}
                motivoCierre={lead.motivoCierre}
                notaCierre={lead.notaCierre}
                esAdmin={canManageOrganization(rol)}
                puedeGestionar={canManageOrganization(rol) || lead.asignado?.id === usuarioId}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

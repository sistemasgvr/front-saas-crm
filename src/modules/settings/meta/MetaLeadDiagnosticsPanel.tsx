"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ComponentCard from "@/src/components/common/ComponentCard";
import ActionButton from "@/src/components/ui/ActionButton";
import Alert from "@/src/components/ui/alert/Alert";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import HelpTooltip from "@/src/components/ui/HelpTooltip";
import { Icon } from "@/src/components/ui/Icon";
import { QueryError } from "@/src/components/ui/PageLoader";
import { unwrapServerAction } from "@/src/lib/action-result";
import { queryKeys } from "@/src/lib/query/keys";
import { diagnoseMetaAdAccountAction, reconcileMetaWhatsappCampaignsAction } from "./actions";
import { formatearFechaMeta } from "./format";

const recuperar = unwrapServerAction(reconcileMetaWhatsappCampaignsAction);
const diagnosticar = unwrapServerAction(diagnoseMetaAdAccountAction);

const AYUDA_DIAGNOSTICO =
  "Consulta en vivo las páginas y líneas de WhatsApp vinculadas a esta conexión, comprueba sus suscripciones y compara los formularios de Meta con el CRM. Las campañas de mensajes generan conversaciones en WhatsApp: la columna de leads cuenta contactos vinculados a la campaña y puede diferir de los resultados publicitarios.";
const AYUDA_VINCULAR =
  "Usa las referencias de anuncios de los mensajes recibidos. Primero sincroniza la estructura. Solo vincula leads que todavía no tienen campaña; no crea contactos ni reemplaza campañas asignadas.";
const AYUDA_WHATSAPP =
  "La suscripción a la cuenta de WhatsApp no verifica por sí sola los campos del webhook ni el número de destino del anuncio.";

function SuscripcionBadge({ suscrito }: { suscrito: boolean | null }) {
  if (suscrito === null) return <Badge size="sm" color="light">Sin verificar</Badge>;
  return suscrito ? (
    <Badge size="sm" color="success">Suscrita</Badge>
  ) : (
    <Badge size="sm" color="error">Sin suscripción</Badge>
  );
}

function ImportacionBadge({ activa }: { activa: boolean | null }) {
  if (activa === null) return <Badge size="sm" color="light">Importación sin configurar</Badge>;
  return activa ? (
    <Badge size="sm" color="success">Importación activa</Badge>
  ) : (
    <Badge size="sm" color="warning">Importación desactivada</Badge>
  );
}

export default function MetaLeadDiagnosticsPanel({ cuentaId }: { cuentaId: string }) {
  const query = useQuery({
    queryKey: ["meta", "ad-accounts", cuentaId, "diagnostics"],
    queryFn: () => diagnosticar(cuentaId),
    enabled: false,
    retry: false,
  });

  return (
    <ComponentCard
      title="Diagnóstico de recepción"
      desc="Comprueba en vivo que los leads de Meta lleguen al CRM."
      help={AYUDA_DIAGNOSTICO}
      actions={
        <>
          <span className="inline-flex items-center gap-1">
            <ActionButton
              action={async () => {
                const resultado = await recuperar(cuentaId);
                toast.success(`Se vincularon ${resultado.vinculados} leads existentes a sus campañas`);
              }}
              loadingText="Vinculando…"
              startIcon={<Icon name="mdi:message-arrow-right-outline" size={18} />}
              invalidateKeys={[["meta", "ad-accounts", cuentaId, "campaigns"], queryKeys.metaAdAccountProfile(cuentaId), ["leads"]]}
            >
              Vincular desde mensajes
            </ActionButton>
            <HelpTooltip content={AYUDA_VINCULAR} placement="bottom" align="end" />
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={query.isFetching}
            disabled={query.isFetching}
            startIcon={<Icon name="mdi:stethoscope" size={18} />}
            onClick={() => { void query.refetch(); }}
          >
            {query.isFetching ? "Verificando…" : "Verificar"}
          </Button>
        </>
      }
    >
      {query.isError && <QueryError error={query.error} />}

      {!query.data && !query.isError && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pulsa «Verificar» para consultar el estado en Meta.
        </p>
      )}

      {query.data && (
        <div className="space-y-4">
          <p className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            Última consulta: {formatearFechaMeta(query.data.verificadoEn)}
            {query.data.aviso && <HelpTooltip content={query.data.aviso} />}
          </p>

          {query.data.paginas.length === 0 && (
            <Alert
              variant="warning"
              title="Sin páginas vinculadas"
              message="No hay páginas vinculadas a esta conexión."
              showLink
              linkHref="/settings/meta/pages"
              linkText="Vincular páginas"
            />
          )}

          {query.data.paginas.map((pagina) => (
            <div key={pagina.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link className="text-sm font-medium text-gray-800 hover:text-brand-500 dark:text-white/90" href={`/settings/meta/pages/${pagina.id}`}>
                  {pagina.nombre}
                </Link>
                <div className="flex flex-wrap gap-1.5">
                  <SuscripcionBadge suscrito={pagina.suscrito} />
                  <ImportacionBadge activa={pagina.importacion} />
                </div>
              </div>
              {pagina.error && <p className="mt-2 text-sm text-warning-500">{pagina.error}</p>}

              {pagina.formularios.length > 0 && (
                <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                  {pagina.formularios.map((form) => (
                    <li key={form.formId} className="py-2.5 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-gray-800 dark:text-white/90">{form.nombre}</span>
                        <span className="text-theme-xs">
                          Meta: {form.leadsMeta ?? "—"} · CRM: {form.leadsCRM}
                        </span>
                      </div>
                      {!form.sincronizado && (
                        <p className="mt-1 text-theme-xs text-warning-500">Falta sincronizar este formulario desde el perfil de la página.</p>
                      )}
                      {form.importacion === false && (
                        <p className="mt-1 text-theme-xs text-warning-500">Importación automática desactivada.</p>
                      )}
                      {form.leadsMeta !== null && form.leadsMeta > form.leadsCRM && (
                        <p className="mt-1 text-theme-xs text-warning-500">
                          Meta reporta {form.leadsMeta - form.leadsCRM} registros más. Revisa la selección de campañas o reimporta el formulario.
                        </p>
                      )}
                      {form.error && <p className="mt-1 text-theme-xs text-warning-500">{form.error}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {query.data.whatsapp.length === 0 && (
            <Alert
              variant="warning"
              title="Sin líneas de WhatsApp"
              message="No hay líneas de WhatsApp vinculadas a esta conexión."
            />
          )}

          {query.data.whatsapp.map((linea) => (
            <div key={linea.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-white/90">
                  WhatsApp · {linea.nombre}
                  <HelpTooltip content={AYUDA_WHATSAPP} />
                </span>
                <SuscripcionBadge suscrito={linea.suscrito} />
              </div>
              <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
                Último mensaje entrante: {formatearFechaMeta(linea.ultimoMensajeEntranteEn, "Sin mensajes registrados")}
              </p>
              {linea.error && <p className="mt-1 text-sm text-warning-500">{linea.error}</p>}
            </div>
          ))}

          <Link className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:underline" href="/chats">
            Ver conversaciones de WhatsApp
            <Icon name="mdi:arrow-right" size={16} />
          </Link>
        </div>
      )}
    </ComponentCard>
  );
}

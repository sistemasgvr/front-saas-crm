"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ActionButton from "@/src/components/ui/ActionButton";
import { queryKeys } from "@/src/lib/query/keys";
import Button from "@/src/components/ui/button/Button";
import { QueryError } from "@/src/components/ui/PageLoader";
import { unwrapServerAction } from "@/src/lib/action-result";
import { diagnoseMetaAdAccountAction, reconcileMetaWhatsappCampaignsAction } from "./actions";
import { formatearFechaMeta } from "./format";

const recuperar = unwrapServerAction(reconcileMetaWhatsappCampaignsAction);
const diagnosticar = unwrapServerAction(diagnoseMetaAdAccountAction);
const estado = (suscrito: boolean | null) => suscrito === null ? "Sin verificar" : suscrito ? "Suscripción confirmada en Meta" : "Sin suscripción de esta app";

export default function MetaLeadDiagnosticsPanel({ cuentaId }: { cuentaId: string }) {
  const query = useQuery({
    queryKey: ["meta", "ad-accounts", cuentaId, "diagnostics"],
    queryFn: () => diagnosticar(cuentaId),
    enabled: false,
    retry: false,
  });
  return <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Diagnóstico de recepción</h2>
        <p className="mt-1 text-sm text-gray-500">Consulta en vivo las páginas y líneas vinculadas a esta conexión. Comprueba suscripciones y compara formularios de Meta con el CRM.</p>
      </div>
      <Button type="button" size="sm" variant="outline" loading={query.isFetching} disabled={query.isFetching} onClick={() => { void query.refetch(); }}>
        {query.isFetching ? "Verificando en Meta…" : "Verificar recepción"}
      </Button>
    </div>
    <p className="text-sm text-gray-500">Las campañas de mensajes generan conversaciones en WhatsApp. La columna de leads cuenta contactos vinculados a la campaña; puede diferir de los resultados publicitarios.</p>
    <div className="space-y-2">
      <ActionButton
        action={async () => {
          const resultado = await recuperar(cuentaId);
          toast.success(`Se vincularon ${resultado.vinculados} leads existentes a sus campañas`);
        }}
        loadingText="Vinculando…"
        invalidateKeys={[["meta", "ad-accounts", cuentaId, "campaigns"], queryKeys.metaAdAccountProfile(cuentaId), ["leads"]]}
      >Vincular campañas desde mensajes guardados</ActionButton>
      <p className="text-xs text-gray-500">Usa las referencias de anuncios de los mensajes recibidos. Primero sincroniza la estructura. Solo vincula leads que todavía no tienen campaña; no crea contactos ni reemplaza campañas asignadas.</p>
    </div>
    {query.isError && <QueryError error={query.error} />}
    {query.data && <div className="space-y-4">
      <p className="text-xs text-gray-500">Última consulta: {formatearFechaMeta(query.data.verificadoEn)}. {query.data.aviso}</p>
      {query.data.paginas.length === 0 && <p className="text-sm text-warning-500">No hay páginas vinculadas a esta conexión. <Link className="underline" href="/settings/meta/pages">Vincular páginas</Link></p>}
      {query.data.paginas.map(pagina => <div key={pagina.id} className="space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <Link className="font-medium text-brand-500" href={`/settings/meta/pages/${pagina.id}`}>{pagina.nombre}</Link>
        <p className={`text-sm ${pagina.suscrito === false ? "text-error-500" : "text-gray-500"}`}>Formularios: {estado(pagina.suscrito)}. Importación de la página: {pagina.importacion ? "activada" : "desactivada"}.</p>
        {pagina.error && <p className="text-sm text-warning-500">{pagina.error}</p>}
        {pagina.formularios.map(form => <div key={form.formId} className="border-t border-gray-100 pt-2 text-sm text-gray-500 dark:border-gray-800">
          <p className="font-medium">{form.nombre}</p>
          <p>Meta: {form.leadsMeta ?? "sin verificar"} · CRM: {form.leadsCRM} · Importación: {form.importacion === null ? "sin configurar" : form.importacion ? "activada" : "desactivada"}</p>
          {!form.sincronizado && <p className="text-warning-500">Falta sincronizar este formulario desde el perfil de la página.</p>}
          {form.leadsMeta !== null && form.leadsMeta > form.leadsCRM && <p className="text-warning-500">Meta reporta {form.leadsMeta - form.leadsCRM} registros más. Revisa la selección de campañas y usa la reimportación del formulario para recuperar leads disponibles.</p>}
          {form.error && <p className="text-warning-500">{form.error}</p>}
        </div>)}
      </div>)}
      {query.data.whatsapp.length === 0 && <p className="text-sm text-warning-500">No hay líneas de WhatsApp vinculadas a esta conexión. Revisa la configuración de WhatsApp si tus anuncios envían a mensajes.</p>}
      {query.data.whatsapp.map(linea => <div key={linea.id} className="space-y-1 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <p className="font-medium text-gray-800 dark:text-white/90">WhatsApp · {linea.nombre}</p>
        <p className="text-sm text-gray-500">{estado(linea.suscrito)}. Último mensaje entrante guardado: {formatearFechaMeta(linea.ultimoMensajeEntranteEn, "Sin mensajes registrados")}.</p>
        <p className="text-xs text-gray-500">La suscripción a la cuenta de WhatsApp no verifica por sí sola los campos del webhook ni el número de destino del anuncio.</p>
        {linea.error && <p className="text-sm text-warning-500">{linea.error}</p>}
      </div>)}
      <Link className="inline-block text-sm text-brand-500 underline" href="/chats">Ver conversaciones de WhatsApp</Link>
    </div>}
  </section>;
}

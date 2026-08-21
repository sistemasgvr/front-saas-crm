"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import Badge from "@/src/components/ui/badge/Badge";
import EmptyState from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/ui/Icon";
import ActionButton from "@/src/components/ui/ActionButton";
import Button from "@/src/components/ui/button/Button";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import { queryKeys } from "@/src/lib/query/keys";
import { getMetaPageFormMetaCounts, getMetaPageForms, getMetaPageProfile } from "./queries";
import {
  healthCheckMetaPageAction,
  resyncMetaPageWebhookAction,
  syncMetaPageFormsAction,
  unlinkMetaPageAction,
} from "./actions";
import MetaFormBackfillPanel from "./MetaFormBackfillPanel";
import MetaStatCard from "./MetaStatCard";
import MetaWebhookBadge from "./MetaWebhookBadge";
import { formatearFechaMeta } from "./format";

function colorEstadoFormulario(estado: string | null): "success" | "warning" | "error" | "light" {
  const v = (estado ?? "").toUpperCase();
  if (v === "ACTIVE") return "success";
  if (v === "ARCHIVED" || v === "DRAFT") return "warning";
  if (v === "DELETED") return "error";
  return "light";
}

function etiquetaEstadoFormulario(estado: string | null) {
  const v = (estado ?? "").toUpperCase();
  if (v === "ACTIVE") return "Activo";
  if (v === "ARCHIVED") return "Archivado";
  if (v === "DRAFT") return "Borrador";
  if (v === "DELETED") return "Eliminado";
  return estado ?? "—";
}

export default function MetaPageProfileView({ id }: { id: string }) {
  const router = useRouter();
  const [backfillFormId, setBackfillFormId] = useState<string | null>(null);

  const { data: pagina, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.metaPageProfile(id),
    queryFn: () => getMetaPageProfile(id),
  });

  const formsQuery = useQuery({
    queryKey: queryKeys.metaPageForms(id),
    queryFn: () => getMetaPageForms(id),
  });

  // Comparar con Meta al cargar (y tras invalidate post-reimport / botón manual).
  const metaCountsQuery = useQuery({
    queryKey: queryKeys.metaPageFormMetaCounts(id),
    queryFn: () => getMetaPageFormMetaCounts(id),
    staleTime: 60_000,
  });
  const conteosMeta = metaCountsQuery.data ?? null;

  if (isLoading) return <PageLoader />;
  if (isError) return <QueryError error={error} />;
  if (!pagina) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pagina.nombre}
        description={pagina.pageId}
        backHref="/settings/meta/pages"
        backLabel="Volver a páginas"
      >
        <MetaWebhookBadge suscrito={pagina.webhookSuscrito} size="md" />
      </PageHeader>

      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <EntityCell
          name={pagina.nombre}
          subtitle={pagina.categoria ?? pagina.pageId}
          src={pagina.fotoUrl}
          icon="mdi:facebook"
          size="lg"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MetaStatCard label="Leads totales" value={pagina.totalLeads} icon="mdi:account-group-outline" />
        <MetaStatCard label="Leads últimos 7 días" value={pagina.leadsUltimos7Dias} icon="mdi:calendar-week" />
        <MetaStatCard
          label="Vinculada desde"
          value={formatearFechaMeta(pagina.fechaCreacion)}
          icon="mdi:calendar-check-outline"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <Icon name="mdi:webhook" size={20} className="text-gray-600 dark:text-gray-300" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Estado del webhook</h2>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {pagina.webhookSuscrito
                ? `Suscrita al webhook de leads desde ${formatearFechaMeta(pagina.webhookSuscritoEn)}.`
                : "No está recibiendo leads en vivo — reintenta la suscripción al webhook."}
            </p>
            {pagina.webhookUltimoCheckEn && (
              <p className="mt-1 text-theme-xs text-gray-400">
                Última verificación: {formatearFechaMeta(pagina.webhookUltimoCheckEn)}
              </p>
            )}
            {pagina.webhookUltimoError && (
              <p className="mt-1 text-theme-xs text-error-500">{pagina.webhookUltimoError}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            action={() => resyncMetaPageWebhookAction(pagina.id)}
            successMessage="Webhook re-suscrito"
            loadingText="Re-suscribiendo…"
            invalidateKeys={[queryKeys.metaPageProfile(id), queryKeys.metaPagesVinculadasAll]}
            startIcon={<Icon name="mdi:refresh" size={18} />}
          >
            Re-suscribir webhook
          </ActionButton>
          <ActionButton
            action={async () => {
              await healthCheckMetaPageAction(pagina.id);
            }}
            successMessage="Verificación completada"
            loadingText="Verificando…"
            variant="outline"
            invalidateKeys={[queryKeys.metaPageProfile(id), queryKeys.metaPagesVinculadasAll]}
            startIcon={<Icon name="mdi:shield-check-outline" size={18} />}
          >
            Verificar en Meta
          </ActionButton>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <Icon name="mdi:form-select" size={20} className="text-gray-600 dark:text-gray-300" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Formularios</h2>
              <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                Lead Ads vinculados a esta página. Reimporta leads desde la creación del formulario hasta hoy.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              action={async () => {
                await metaCountsQuery.refetch();
              }}
              successMessage="Conteo de Meta actualizado"
              loadingText="Consultando Meta…"
              variant="outline"
              startIcon={<Icon name="mdi:facebook" size={18} />}
            >
              Comparar con Meta
            </ActionButton>
            <ActionButton
              action={async () => {
                await syncMetaPageFormsAction(pagina.id);
              }}
              successMessage="Formularios sincronizados"
              loadingText="Sincronizando…"
              invalidateKeys={[
                queryKeys.metaPageForms(id),
                queryKeys.metaPageFormMetaCounts(id),
              ]}
              startIcon={<Icon name="mdi:sync" size={18} />}
            >
              Sincronizar formularios
            </ActionButton>
          </div>
        </div>

        {formsQuery.isLoading ? (
          <PageLoader />
        ) : formsQuery.isError ? (
          <QueryError error={formsQuery.error} />
        ) : formsQuery.data && formsQuery.data.length === 0 ? (
          <EmptyState
            icon="mdi:form-select"
            title="Sin formularios sincronizados"
            description='Usa "Sincronizar formularios" para traer los Lead Ads de esta página desde Meta.'
          />
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-500">
                    Formulario
                  </TableCell>
                  <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-500">
                    Estado
                  </TableCell>
                  <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-500">
                    Leads
                  </TableCell>
                  <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-500">
                    Total en Meta
                  </TableCell>
                  <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-500">
                    Creado
                  </TableCell>
                  <TableCell isHeader className="px-3 py-2 text-start text-theme-xs font-medium text-gray-500">
                    Última sync
                  </TableCell>
                  <TableCell isHeader className="px-3 py-2 text-end text-theme-xs font-medium text-gray-500">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(formsQuery.data ?? []).map((formulario) => {
                  const abierto = backfillFormId === formulario.formId;
                  return (
                    <TableRow
                      key={formulario.id}
                      className={abierto ? "bg-brand-50/40 dark:bg-brand-500/5" : undefined}
                    >
                      <TableCell className="px-3 py-2.5">
                        <EntityCell
                          name={formulario.nombre}
                          subtitle={formulario.formId}
                          icon="mdi:form-select"
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2.5">
                        <Badge color={colorEstadoFormulario(formulario.estadoMeta)} size="sm">
                          {etiquetaEstadoFormulario(formulario.estadoMeta)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-theme-sm text-gray-500">
                        {formulario.totalLeads}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-theme-sm">
                        {metaCountsQuery.isLoading || metaCountsQuery.isFetching ? (
                          <span className="text-gray-400">…</span>
                        ) : conteosMeta === null || metaCountsQuery.isError ? (
                          <span className="text-gray-400">—</span>
                        ) : conteosMeta[formulario.formId] === undefined ? (
                          <span className="text-gray-400" title="No se pudo consultar Meta para este formulario">
                            error
                          </span>
                        ) : conteosMeta[formulario.formId] > formulario.totalLeads ? (
                          <span className="font-medium text-warning-500">
                            {conteosMeta[formulario.formId]} (faltan{" "}
                            {conteosMeta[formulario.formId] - formulario.totalLeads})
                          </span>
                        ) : (
                          <span className="text-success-500">{conteosMeta[formulario.formId]}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-theme-sm text-gray-500">
                        {formatearFechaMeta(formulario.fechaCreacion)}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-theme-sm text-gray-500">
                        {formatearFechaMeta(formulario.ultimoSyncEn)}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-end">
                        <TableAction
                          icon={abierto ? "mdi:close" : "mdi:database-import-outline"}
                          label={abierto ? "Cerrar reimportación" : "Reimportar leads"}
                          onClick={() => setBackfillFormId(abierto ? null : formulario.formId)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {backfillFormId && (
          <MetaFormBackfillPanel
            pageId={pagina.id}
            formId={backfillFormId}
            formNombre={
              formsQuery.data?.find((f) => f.formId === backfillFormId)?.nombre ?? backfillFormId
            }
            fechaCreacion={formsQuery.data?.find((f) => f.formId === backfillFormId)?.fechaCreacion}
            onClose={() => setBackfillFormId(null)}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <Link href={`/leads?metaPaginaId=${pagina.id}`}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            startIcon={<Icon name="mdi:account-multiple-outline" size={18} />}
          >
            Ver leads de esta página
          </Button>
        </Link>
        <ActionButton
          action={async () => {
            await unlinkMetaPageAction(pagina.id);
            router.push("/settings/meta/pages");
          }}
          successMessage="Página desvinculada"
          variant="outline"
          startIcon={<Icon name="mdi:link-off" size={18} />}
          invalidateKeys={[
            queryKeys.metaPagesVinculadasAll,
            queryKeys.metaPagesAvailable,
            queryKeys.metaConnection,
          ]}
        >
          Desvincular página
        </ActionButton>
      </div>
    </div>
  );
}

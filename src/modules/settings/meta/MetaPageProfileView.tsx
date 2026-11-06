"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ComponentCard from "@/src/components/common/ComponentCard";
import { InfoGrid, InfoItem } from "@/src/components/common/InfoItem";
import MetricCard from "@/src/components/common/MetricCard";
import ProfileCard from "@/src/components/common/ProfileCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import ActionButton from "@/src/components/ui/ActionButton";
import Alert from "@/src/components/ui/alert/Alert";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import MobileCard from "@/src/components/ui/MobileCard";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import Pagination from "@/src/components/ui/Pagination";
import TableAction from "@/src/components/ui/TableAction";
import TableSectionCard, {
  sectionTbodyClass,
  sectionTdClass,
  sectionTdPrimaryClass,
  sectionThClass,
  sectionThClassEnd,
  sectionTheadClass,
} from "@/src/components/ui/TableSectionCard";
import { usePaginationPage } from "@/src/components/ui/use-pagination-page";
import { unwrapServerAction } from "@/src/lib/action-result";
import { queryKeys } from "@/src/lib/query/keys";
import { getMetaPageFormMetaCounts, getMetaPageForms, getMetaPageProfile } from "./queries";
import {
  healthCheckMetaPageAction as healthCheckMetaPageActionResult,
  resyncMetaPageWebhookAction as resyncMetaPageWebhookActionResult,
  syncMetaPageFormsAction as syncMetaPageFormsActionResult,
  unlinkMetaPageAction as unlinkMetaPageActionResult,
} from "./actions";
import MetaFormBackfillPanel from "./MetaFormBackfillPanel";
import MetaLeadSourceToggle from "./MetaLeadSourceToggle";
import MetaWebhookBadge from "./MetaWebhookBadge";
import { formatearFechaMeta } from "./format";
const healthCheckMetaPageAction = unwrapServerAction(healthCheckMetaPageActionResult);
const resyncMetaPageWebhookAction = unwrapServerAction(resyncMetaPageWebhookActionResult);
const syncMetaPageFormsAction = unwrapServerAction(syncMetaPageFormsActionResult);
const unlinkMetaPageAction = unwrapServerAction(unlinkMetaPageActionResult);


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
  const [page, setPage] = usePaginationPage(id);
  const [backfillFormId, setBackfillFormId] = useState<string | null>(null);

  const { data: pagina, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.metaPageProfile(id),
    queryFn: () => getMetaPageProfile(id),
  });

  const formsQuery = useQuery({
    queryKey: [...queryKeys.metaPageForms(id), page],
    queryFn: () => getMetaPageForms(id, page),
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

  const formularioBackfill = formsQuery.data?.data.find((f) => f.formId === backfillFormId);
  const formularios = formsQuery.data?.data ?? [];

  const conteoMeta = (formId: string, totalLeads: number) => {
    const enMeta = conteosMeta?.[formId];
    if (metaCountsQuery.isLoading || metaCountsQuery.isFetching) return <span className="text-gray-400">…</span>;
    if (conteosMeta === null || metaCountsQuery.isError) return <span className="text-gray-400">—</span>;
    if (enMeta === undefined) {
      return (
        <span className="text-gray-400" title="No se pudo consultar Meta para este formulario">
          error
        </span>
      );
    }
    if (enMeta > totalLeads) {
      return (
        <span className="font-medium text-warning-500">
          {enMeta} (faltan {enMeta - totalLeads})
        </span>
      );
    }
    return <span className="text-success-500">{enMeta}</span>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Página de Meta"
        description="Recepción de leads, webhook y formularios de esta página."
        backHref="/settings/meta/pages"
        backLabel="Volver a páginas"
      />

      <ProfileCard
        name={pagina.nombre}
        src={pagina.fotoUrl}
        icon="mdi:facebook"
        meta={[pagina.categoria, pagina.pageId, `Vinculada desde ${formatearFechaMeta(pagina.fechaCreacion)}`]}
        badges={
          <>
            <MetaWebhookBadge suscrito={pagina.webhookSuscrito} size="md" />
            <MetaLeadSourceToggle tipo="paginas" id={pagina.id} nombre={pagina.nombre} label="Leads automáticos" />
          </>
        }
        actions={
          <>
            <Link href={`/leads?metaPaginaId=${pagina.id}`}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                startIcon={<Icon name="mdi:account-multiple-outline" size={18} />}
              >
                Leads
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
              Desvincular
            </ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 lg:gap-3">
        <MetricCard label="Leads totales" value={pagina.totalLeads} icon="mdi:account-group-outline" />
        <MetricCard label="Leads últimos 7 días" value={pagina.leadsUltimos7Dias} icon="mdi:calendar-week" />
      </div>

      <ComponentCard
        title="Estado del webhook"
        desc="Meta avisa al CRM por este webhook cada vez que llega un lead nuevo."
        actions={
          <>
            <ActionButton
              action={() => resyncMetaPageWebhookAction(pagina.id)}
              successMessage="Webhook re-suscrito"
              loadingText="Re-suscribiendo…"
              invalidateKeys={[queryKeys.metaPageProfile(id), queryKeys.metaPagesVinculadasAll]}
              startIcon={<Icon name="mdi:refresh" size={18} />}
            >
              Re-suscribir
            </ActionButton>
            <ActionButton
              action={async () => {
                const resultado = await healthCheckMetaPageAction(pagina.id);
                if (!resultado.webhookSuscrito) {
                  throw new Error(
                    resultado.webhookUltimoError ??
                      "El webhook de la página no está suscrito en Meta",
                  );
                }
              }}
              successMessage="Verificación completada"
              loadingText="Verificando…"
              variant="outline"
              invalidateKeys={[queryKeys.metaPageProfile(id), queryKeys.metaPagesVinculadasAll]}
              startIcon={<Icon name="mdi:shield-check-outline" size={18} />}
            >
              Verificar
            </ActionButton>
          </>
        }
      >
        <InfoGrid>
          <InfoItem label="Suscrita desde">
            {pagina.webhookSuscrito ? formatearFechaMeta(pagina.webhookSuscritoEn) : "No suscrita"}
          </InfoItem>
          <InfoItem label="Última verificación">{formatearFechaMeta(pagina.webhookUltimoCheckEn, "Sin verificar")}</InfoItem>
        </InfoGrid>
        {pagina.webhookUltimoError && (
          <Alert variant="error" title="Último error del webhook" message={pagina.webhookUltimoError} />
        )}
        {!pagina.webhookSuscrito && !pagina.webhookUltimoError && (
          <Alert
            variant="warning"
            title="Sin leads en vivo"
            message="La página no está suscrita al webhook de leads. Usa «Re-suscribir» para reintentar."
          />
        )}
      </ComponentCard>

      <TableSectionCard
        title="Formularios"
        desc="Lead Ads de esta página y su entrada automática."
        help="La entrada automática requiere que la página, el formulario y la campaña estén habilitados. La reimportación manual es independiente."
        actions={
          <>
            <ActionButton
              action={async () => {
                await metaCountsQuery.refetch();
              }}
              successMessage="Conteo de Meta actualizado"
              loadingText="Consultando Meta…"
              variant="outline"
              startIcon={<Icon name="mdi:facebook" size={18} />}
            >
              Comparar
            </ActionButton>
            <ActionButton
              action={async () => {
                const resultado = await syncMetaPageFormsAction(pagina.id);
                if (resultado.sincronizados !== resultado.total) throw new Error(`Solo se sincronizaron ${resultado.sincronizados} de ${resultado.total} formularios. Vuelve a sincronizar para completar el listado.`);
              }}
              successMessage="Formularios sincronizados"
              loadingText="Sincronizando…"
              invalidateKeys={[
                queryKeys.metaPageForms(id),
                queryKeys.metaPageFormMetaCounts(id),
              ]}
              startIcon={<Icon name="mdi:sync" size={18} />}
            >
              Sincronizar
            </ActionButton>
          </>
        }
        footer={
          formsQuery.data && formsQuery.data.total > 0 ? (
            <Pagination {...formsQuery.data} onPageChange={setPage} itemLabel="formularios" />
          ) : undefined
        }
      >
        {formsQuery.isLoading ? (
          <PageLoader />
        ) : formsQuery.isError ? (
          <QueryError error={formsQuery.error} />
        ) : formsQuery.data && formsQuery.data.data.length === 0 ? (
          <EmptyState
            icon="mdi:form-select"
            title="Sin formularios sincronizados"
            description="Usa «Sincronizar» para traer los Lead Ads de esta página desde Meta."
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {formularios.map((formulario) => {
                const abierto = backfillFormId === formulario.formId;
                return (
                  <MobileCard
                    key={formulario.id}
                    className={abierto ? "border-brand-300 dark:border-brand-500/40" : ""}
                    header={
                      <EntityCell name={formulario.nombre} subtitle={formulario.formId} icon="mdi:form-select" size="md" />
                    }
                    aside={
                      <Badge color={colorEstadoFormulario(formulario.estadoMeta)} size="sm">
                        {etiquetaEstadoFormulario(formulario.estadoMeta)}
                      </Badge>
                    }
                    fields={[
                      { label: "Leads", value: formulario.totalLeads },
                      { label: "Total en Meta", value: conteoMeta(formulario.formId, formulario.totalLeads) },
                      { label: "Creado", value: formatearFechaMeta(formulario.fechaCreacion) },
                      { label: "Última sync", value: formatearFechaMeta(formulario.ultimoSyncEn) },
                      {
                        label: "Leads automáticos",
                        value: (
                          <MetaLeadSourceToggle
                            tipo="formularios"
                            id={formulario.id}
                            nombre={formulario.nombre}
                            paginaId={pagina.id}
                          />
                        ),
                      },
                    ]}
                    actions={
                      <TableAction
                        icon={abierto ? "mdi:close" : "mdi:database-import-outline"}
                        label={abierto ? "Cerrar reimportación" : "Reimportar leads"}
                        onClick={() => setBackfillFormId(abierto ? null : formulario.formId)}
                      />
                    }
                  />
                );
              })}
            </div>
            <div className="hidden md:block">
          <Table>
            <TableHeader className={sectionTheadClass}>
              <TableRow>
                <TableCell isHeader className={sectionThClass}>
                  Formulario
                </TableCell>
                <TableCell isHeader className={sectionThClass}>
                  Estado
                </TableCell>
                <TableCell isHeader className={sectionThClass}>
                  Leads
                </TableCell>
                <TableCell isHeader className={sectionThClass}>
                  Total en Meta
                </TableCell>
                <TableCell isHeader className={sectionThClass}>
                  Creado
                </TableCell>
                <TableCell isHeader className={sectionThClass}>
                  Última sync
                </TableCell>
                <TableCell isHeader className={sectionThClass}>
                  Leads automáticos
                </TableCell>
                <TableCell isHeader className={sectionThClassEnd}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className={sectionTbodyClass}>
              {formularios.map((formulario) => {
                const abierto = backfillFormId === formulario.formId;
                return (
                  <TableRow
                    key={formulario.id}
                    className={abierto ? "bg-brand-50/40 dark:bg-brand-500/5" : undefined}
                  >
                    <TableCell className={sectionTdPrimaryClass}>
                      <div className="max-w-[18rem]" title={formulario.nombre}>
                        <EntityCell
                          name={formulario.nombre}
                          subtitle={formulario.formId}
                          icon="mdi:form-select"
                          size="md"
                        />
                      </div>
                    </TableCell>
                    <TableCell className={sectionTdClass}>
                      <Badge color={colorEstadoFormulario(formulario.estadoMeta)} size="sm">
                        {etiquetaEstadoFormulario(formulario.estadoMeta)}
                      </Badge>
                    </TableCell>
                    <TableCell className={sectionTdClass}>{formulario.totalLeads}</TableCell>
                    <TableCell className={sectionTdClass}>{conteoMeta(formulario.formId, formulario.totalLeads)}</TableCell>
                    <TableCell className={sectionTdClass}>{formatearFechaMeta(formulario.fechaCreacion)}</TableCell>
                    <TableCell className={sectionTdClass}>{formatearFechaMeta(formulario.ultimoSyncEn)}</TableCell>
                    <TableCell className={sectionTdClass}>
                      <MetaLeadSourceToggle tipo="formularios" id={formulario.id} nombre={formulario.nombre} paginaId={pagina.id} />
                    </TableCell>
                    <TableCell className={`${sectionTdClass} text-end`}>
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
          </>
        )}
      </TableSectionCard>

      {backfillFormId && (
        <MetaFormBackfillPanel
          pageId={pagina.id}
          formId={backfillFormId}
          formNombre={formularioBackfill?.nombre ?? backfillFormId}
          fechaCreacion={formularioBackfill?.fechaCreacion}
          onClose={() => setBackfillFormId(null)}
        />
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import MetricCard from "@/src/components/common/MetricCard";
import ProfileCard from "@/src/components/common/ProfileCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import ActionButton from "@/src/components/ui/ActionButton";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import MobileCard from "@/src/components/ui/MobileCard";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import Pagination from "@/src/components/ui/Pagination";
import TableSectionCard, {
  sectionTbodyClass,
  sectionTdClass,
  sectionTdPrimaryClass,
  sectionThClass,
  sectionTheadClass,
} from "@/src/components/ui/TableSectionCard";
import { usePaginationPage } from "@/src/components/ui/use-pagination-page";
import { unwrapServerAction } from "@/src/lib/action-result";
import { queryKeys } from "@/src/lib/query/keys";
import { getMetaAdAccountProfile, getMetaAdAccountCampaigns } from "./queries";
import { syncMetaAdAccountAction as syncMetaAdAccountActionResult, unlinkMetaAdAccountAction as unlinkMetaAdAccountActionResult } from "./actions";
import MetaInsightsSyncPanel from "./MetaInsightsSyncPanel";
import MetaLeadDiagnosticsPanel from "./MetaLeadDiagnosticsPanel";
import MetaLeadSourceToggle from "./MetaLeadSourceToggle";
import { formatearFechaMeta, formatearMonto } from "./format";
const syncMetaAdAccountAction = unwrapServerAction(syncMetaAdAccountActionResult);
const unlinkMetaAdAccountAction = unwrapServerAction(unlinkMetaAdAccountActionResult);

function estadoCampana(estado: string | null): { label: string; color: "success" | "warning" | "light" } {
  if (estado === "ACTIVE") return { label: "Activa", color: "success" };
  if (estado === "PAUSED") return { label: "Pausada", color: "warning" };
  return { label: estado ?? "—", color: "light" };
}

export default function MetaAdAccountProfileView({ id }: { id: string }) {
  const router = useRouter();
  const [page, setPage] = usePaginationPage(id);
  const campaigns = useQuery({
    queryKey: ["meta", "ad-accounts", id, "campaigns", page],
    queryFn: () => getMetaAdAccountCampaigns(id, page),
  });

  const { data: cuenta, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.metaAdAccountProfile(id),
    queryFn: () => getMetaAdAccountProfile(id),
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <QueryError error={error} />;
  if (!cuenta) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuenta publicitaria"
        description="Campañas sincronizadas, métricas y recepción de leads de esta cuenta."
        backHref="/settings/meta/ad-accounts"
        backLabel="Volver a cuentas"
      />

      <ProfileCard
        name={cuenta.nombre}
        icon="mdi:bullhorn-outline"
        meta={[
          cuenta.adAccountId,
          cuenta.moneda,
          `Última sincronización: ${formatearFechaMeta(cuenta.ultimoSyncEn, "Nunca")}`,
        ]}
        actions={
          <>
            <Link href={`/leads?metaCuentaId=${cuenta.id}`}>
              <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:account-multiple-outline" size={18} />}>
                Leads
              </Button>
            </Link>
            <Link href={`/dashboard?metaCuentaId=${cuenta.id}`}>
              <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:view-dashboard-outline" size={18} />}>
                Dashboard
              </Button>
            </Link>
            <ActionButton
              action={async () => {
                await unlinkMetaAdAccountAction(cuenta.id);
                router.push("/settings/meta/ad-accounts");
              }}
              successMessage="Cuenta desvinculada"
              variant="outline"
              startIcon={<Icon name="mdi:link-off" size={18} />}
              invalidateKeys={[queryKeys.metaAdAccountsVinculadasAll, queryKeys.metaAdAccountsAvailable, queryKeys.metaConnection]}
            >
              Desvincular
            </ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
        <MetricCard label="Campañas sincronizadas" value={cuenta.totalCampanas} icon="mdi:bullhorn-outline" />
        <MetricCard label="Leads totales" value={cuenta.totalLeads} icon="mdi:account-group-outline" />
        <MetricCard label="Inversión (Insights)" value={formatearMonto(cuenta.spend, cuenta.moneda)} icon="mdi:cash-multiple" />
        <MetricCard label="CPL" value={formatearMonto(cuenta.cpl, cuenta.moneda)} icon="mdi:account-cash-outline" />
      </div>

      <MetaLeadDiagnosticsPanel cuentaId={id} />

      <MetaInsightsSyncPanel cuentaId={cuenta.id} />

      <TableSectionCard
        title="Todas las campañas"
        desc="Activa o desactiva la entrada automática de leads por campaña."
        help="Campañas sincronizadas desde Meta, incluidas las pausadas."
        actions={
          <ActionButton
            action={async () => {
              const resultado = await syncMetaAdAccountAction(cuenta.id);
              if (resultado.truncado || resultado.incompleto) {
                toast.warning(
                  resultado.aviso ??
                    "La sincronización se truncó; puede faltar jerarquía de anuncios.",
                );
              }
            }}
            successMessage="Estructura sincronizada"
            loadingText="Sincronizando…"
            invalidateKeys={[["meta", "lead-sources"], ["meta", "ad-accounts", id, "campaigns"], queryKeys.metaAdAccountProfile(id), queryKeys.metaAdAccountsVinculadasAll]}
            startIcon={<Icon name="mdi:sync" size={18} />}
          >
            Sincronizar
          </ActionButton>
        }
        footer={
          campaigns.data && campaigns.data.total > 0 ? (
            <Pagination {...campaigns.data} onPageChange={setPage} itemLabel="campañas" />
          ) : undefined
        }
      >
        {campaigns.isLoading ? (
          <PageLoader />
        ) : campaigns.isError ? (
          <QueryError error={campaigns.error} />
        ) : campaigns.data?.total === 0 ? (
          <EmptyState
            icon="mdi:bullhorn-outline"
            title="Sin campañas sincronizadas"
            description="Usa «Sincronizar» para importar campañas desde Meta."
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {(campaigns.data?.data ?? []).map((campana) => {
                const estado = estadoCampana(campana.estadoMeta);
                return (
                  <MobileCard
                    key={campana.id}
                    header={<p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{campana.nombre}</p>}
                    aside={
                      <Badge size="sm" color={estado.color}>
                        {estado.label}
                      </Badge>
                    }
                    fields={[
                      { label: "Leads importados", value: campana.totalLeads },
                      {
                        label: "Leads automáticos",
                        value: <MetaLeadSourceToggle tipo="campanas" id={campana.id} nombre={campana.nombre} />,
                      },
                    ]}
                  />
                );
              })}
            </div>
            <div className="hidden md:block">
          <Table>
            <TableHeader className={sectionTheadClass}>
              <TableRow>
                <TableCell isHeader className={sectionThClass}>
                  Campaña
                </TableCell>
                <TableCell isHeader className={sectionThClass}>
                  Estado
                </TableCell>
                <TableCell isHeader className={sectionThClass}>
                  Leads importados
                </TableCell>
                <TableCell isHeader className={sectionThClass}>
                  Leads automáticos
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className={sectionTbodyClass}>
              {(campaigns.data?.data ?? []).map((campana) => {
                const estado = estadoCampana(campana.estadoMeta);
                return (
                  <TableRow key={campana.id}>
                    <TableCell className={sectionTdPrimaryClass}>
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{campana.nombre}</p>
                    </TableCell>
                    <TableCell className={sectionTdClass}>
                      <Badge size="sm" color={estado.color}>
                        {estado.label}
                      </Badge>
                    </TableCell>
                    <TableCell className={sectionTdClass}>{campana.totalLeads}</TableCell>
                    <TableCell className={sectionTdClass}>
                      <MetaLeadSourceToggle tipo="campanas" id={campana.id} nombre={campana.nombre} />
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
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import EmptyState from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/ui/Icon";
import ActionButton from "@/src/components/ui/ActionButton";
import Button from "@/src/components/ui/button/Button";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableCard, { tdClass, thClass } from "@/src/components/ui/TableCard";
import { queryKeys } from "@/src/lib/query/keys";
import { getMetaAdAccountProfile } from "./queries";
import { syncMetaAdAccountAction, unlinkMetaAdAccountAction } from "./actions";
import MetaStatCard from "./MetaStatCard";
import { formatearFechaMeta } from "./format";

export default function MetaAdAccountProfileView({ id }: { id: string }) {
  const router = useRouter();

  const { data: cuenta, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.metaAdAccountProfile(id),
    queryFn: () => getMetaAdAccountProfile(id),
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <QueryError error={error} />;
  if (!cuenta) return null;

  const subtitle = [cuenta.adAccountId, cuenta.moneda].filter(Boolean).join(" · ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={cuenta.nombre}
        description={subtitle}
        backHref="/settings/meta/ad-accounts"
        backLabel="Volver a cuentas"
      />

      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <EntityCell
          name={cuenta.nombre}
          subtitle={subtitle}
          icon="mdi:bullhorn-outline"
          shape="rounded"
          size="lg"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetaStatCard label="Campañas sincronizadas" value={cuenta.totalCampanas} icon="mdi:bullhorn-outline" />
        <MetaStatCard label="Leads totales" value={cuenta.totalLeads} icon="mdi:account-group-outline" />
        <MetaStatCard
          label="Última sincronización"
          value={formatearFechaMeta(cuenta.ultimoSyncEn, "Nunca")}
          icon="mdi:sync"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <Icon name="mdi:chart-timeline-variant" size={20} className="text-gray-600 dark:text-gray-300" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Campañas recientes</h2>
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">Últimas campañas sincronizadas desde Meta.</p>
            </div>
          </div>
          <ActionButton
            action={async () => {
              await syncMetaAdAccountAction(cuenta.id);
            }}
            successMessage="Cuenta sincronizada"
            loadingText="Sincronizando…"
            invalidateKeys={[queryKeys.metaAdAccountProfile(id), queryKeys.metaAdAccountsVinculadasAll]}
            startIcon={<Icon name="mdi:sync" size={18} />}
          >
            Sincronizar ahora
          </ActionButton>
        </div>

        {cuenta.ultimasCampanas.length === 0 ? (
          <EmptyState
            icon="mdi:bullhorn-outline"
            title="Sin campañas sincronizadas"
            description='Usa "Sincronizar ahora" para importar campañas desde Meta.'
          />
        ) : (
          <TableCard>
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className={thClass}>
                    Campaña
                  </TableCell>
                  <TableCell isHeader className={thClass}>
                    Estado
                  </TableCell>
                  <TableCell isHeader className={thClass}>
                    Leads
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {cuenta.ultimasCampanas.map((campana) => (
                  <TableRow key={campana.id}>
                    <TableCell className="px-5 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {campana.nombre}
                    </TableCell>
                    <TableCell className={tdClass}>{campana.estadoMeta ?? "—"}</TableCell>
                    <TableCell className={tdClass}>{campana.totalLeads}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap gap-3">
          <Link href={`/leads?metaCuentaId=${cuenta.id}`}>
            <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:account-multiple-outline" size={18} />}>
              Ver leads
            </Button>
          </Link>
          <Link href={`/dashboard?metaCuentaId=${cuenta.id}`}>
            <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:view-dashboard-outline" size={18} />}>
              Ver dashboard
            </Button>
          </Link>
        </div>
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
          Desvincular cuenta
        </ActionButton>
      </div>
    </div>
  );
}

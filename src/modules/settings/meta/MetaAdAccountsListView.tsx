"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import EmptyState from "@/src/components/ui/EmptyState";
import Pagination from "@/src/components/ui/Pagination";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import TableCard, { tdClass, tdPrimaryClass, thClass, thClassEnd } from "@/src/components/ui/TableCard";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { getMetaAdAccountsAvailable, getMetaAdAccountsVinculadas } from "./queries";
import { linkMetaAdAccountAction, unlinkMetaAdAccountAction } from "./actions";
import MetaHubLayout from "./MetaHubLayout";
import MetaLinkResourcePanel from "./MetaLinkResourcePanel";
import { formatearFechaMeta } from "./format";

function UnlinkAdAccountAction({ id }: { id: string }) {
  const mutation = useAppMutation({
    mutationFn: () => unlinkMetaAdAccountAction(id),
    successMessage: "Cuenta desvinculada",
    invalidateKeys: [queryKeys.metaAdAccountsVinculadasAll, queryKeys.metaAdAccountsAvailable, queryKeys.metaConnection],
  });

  return (
    <TableAction
      icon="mdi:link-off"
      label="Desvincular"
      variant="danger"
      onClick={() => mutation.mutate()}
    />
  );
}

export default function MetaAdAccountsListView() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.metaAdAccountsVinculadas({ page }),
    queryFn: () => getMetaAdAccountsVinculadas(page),
  });

  const accounts = data?.data ?? [];

  return (
    <MetaHubLayout
      title="Cuentas publicitarias"
      description="Sincroniza campañas, conjuntos y anuncios de cada cuenta para filtrar leads y KPIs."
    >
      <div className="space-y-6">
        <MetaLinkResourcePanel
          title="Agregar cuenta publicitaria"
          icon="mdi:bullhorn-outline"
          loadingLabel="Cargando cuentas disponibles…"
          emptyMessage="No hay cuentas nuevas por vincular"
          queryKey={queryKeys.metaAdAccountsAvailable}
          queryFn={() => getMetaAdAccountsAvailable()}
          onLink={(item) => linkMetaAdAccountAction(item.id, item.nombre)}
          successMessage="Cuenta publicitaria vinculada"
          invalidateKeys={[
            queryKeys.metaAdAccountsVinculadasAll,
            queryKeys.metaAdAccountsAvailable,
            queryKeys.metaConnection,
          ]}
        />

        {isLoading ? (
          <PageLoader />
        ) : isError ? (
          <QueryError error={error} />
        ) : (
          <TableCard
            footer={
              data ? (
                <Pagination
                  page={data.page}
                  pageSize={data.pageSize}
                  total={data.total}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                  itemLabel="cuentas"
                />
              ) : undefined
            }
          >
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className={thClass}>
                    Cuenta
                  </TableCell>
                  <TableCell isHeader className={thClass}>
                    Moneda
                  </TableCell>
                  <TableCell isHeader className={thClass}>
                    Última sync
                  </TableCell>
                  <TableCell isHeader className={thClassEnd}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {accounts.length === 0 && (
                  <EmptyState
                    colSpan={4}
                    icon="mdi:bullhorn-outline"
                    title="No hay cuentas publicitarias vinculadas"
                    description="Agrega una cuenta para sincronizar campañas y leads."
                  />
                )}
                {accounts.map((cuenta) => (
                  <TableRow key={cuenta.id}>
                    <TableCell className={tdPrimaryClass}>
                      <Link href={`/settings/meta/ad-accounts/${cuenta.id}`}>
                        <EntityCell
                          name={cuenta.nombre}
                          subtitle={cuenta.adAccountId}
                          icon="mdi:bullhorn-outline"
                          shape="rounded"
                          size="sm"
                        />
                      </Link>
                    </TableCell>
                    <TableCell className={tdClass}>{cuenta.moneda ?? "—"}</TableCell>
                    <TableCell className={tdClass}>{formatearFechaMeta(cuenta.ultimoSyncEn, "Nunca")}</TableCell>
                    <TableCell className={`${tdClass} text-end`}>
                      <div className="inline-flex items-center gap-1">
                        <TableAction
                          href={`/settings/meta/ad-accounts/${cuenta.id}`}
                          icon="mdi:eye-outline"
                          label="Ver perfil"
                        />
                        <UnlinkAdAccountAction id={cuenta.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
      </div>
    </MetaHubLayout>
  );
}

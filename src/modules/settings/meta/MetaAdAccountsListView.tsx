"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import Button from "@/src/components/ui/button/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/ui/Icon";
import MobileCard from "@/src/components/ui/MobileCard";
import Pagination from "@/src/components/ui/Pagination";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import TableCard, {
  tbodyClass,
  tdClass,
  tdPrimaryClass,
  thClass,
  thClassEnd,
  theadClass,
} from "@/src/components/ui/TableCard";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { getMetaAdAccountsAvailable, getMetaAdAccountsVinculadas } from "./queries";
import { linkMetaAdAccountAction as linkMetaAdAccountActionResult, unlinkMetaAdAccountAction as unlinkMetaAdAccountActionResult } from "./actions";
import MetaHubLayout from "./MetaHubLayout";
import MetaLinkResourceModal from "./MetaLinkResourceModal";
import { formatearFechaMeta } from "./format";
import { unwrapServerAction } from "@/src/lib/action-result";
const linkMetaAdAccountAction = unwrapServerAction(linkMetaAdAccountActionResult);
const unlinkMetaAdAccountAction = unwrapServerAction(unlinkMetaAdAccountActionResult);


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
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    />
  );
}

export default function MetaAdAccountsListView() {
  const [page, setPage] = useState(1);
  const [vincularAbierto, setVincularAbierto] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.metaAdAccountsVinculadas({ page }),
    queryFn: () => getMetaAdAccountsVinculadas(page),
  });

  const accounts = data?.data ?? [];
  const paginacion =
    data && data.total > 0 ? (
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        totalPages={data.totalPages}
        onPageChange={setPage}
        itemLabel="cuentas"
      />
    ) : undefined;

  return (
    <MetaHubLayout
      title="Cuentas publicitarias"
      description="Sincroniza campañas, conjuntos y anuncios de cada cuenta para filtrar leads y KPIs."
      headerActions={
        <Button
          size="sm"
          startIcon={<Icon name="mdi:link-plus" size={18} />}
          onClick={() => setVincularAbierto(true)}
        >
          Vincular cuenta
        </Button>
      }
    >
      <MetaLinkResourceModal
        open={vincularAbierto}
        onClose={() => setVincularAbierto(false)}
        title="Vincular cuenta publicitaria"
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
        <>
        <div className="space-y-3 md:hidden">
          {accounts.length === 0 ? (
            <TableCard>
              <EmptyState
                icon="mdi:bullhorn-outline"
                title="No hay cuentas publicitarias vinculadas"
                description="Usa «Vincular cuenta» para sincronizar campañas y leads."
              />
            </TableCard>
          ) : (
            accounts.map((cuenta) => (
              <MobileCard
                key={cuenta.id}
                header={
                  <Link href={`/settings/meta/ad-accounts/${cuenta.id}`}>
                    <EntityCell
                      name={cuenta.nombre}
                      subtitle={cuenta.adAccountId}
                      icon="mdi:bullhorn-outline"
                      size="md"
                    />
                  </Link>
                }
                fields={[
                  { label: "Moneda", value: cuenta.moneda ?? "—" },
                  { label: "Última sync", value: formatearFechaMeta(cuenta.ultimoSyncEn, "Nunca") },
                ]}
                actions={
                  <>
                    <TableAction href={`/settings/meta/ad-accounts/${cuenta.id}`} icon="mdi:eye-outline" label="Ver perfil" />
                    <UnlinkAdAccountAction id={cuenta.id} />
                  </>
                }
              />
            ))
          )}
          {paginacion}
        </div>
        <div className="hidden md:block">
        <TableCard footer={paginacion}>
          <Table>
            <TableHeader className={theadClass}>
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
            <TableBody className={tbodyClass}>
              {accounts.length === 0 && (
                <EmptyState
                  colSpan={4}
                  icon="mdi:bullhorn-outline"
                  title="No hay cuentas publicitarias vinculadas"
                  description="Usa «Vincular cuenta» para sincronizar campañas y leads."
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
                        size="md"
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
        </div>
        </>
      )}
    </MetaHubLayout>
  );
}

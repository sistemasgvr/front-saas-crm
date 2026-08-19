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
import { getMetaPagesAvailable, getMetaPagesVinculadas } from "./queries";
import { linkMetaPageAction, unlinkMetaPageAction } from "./actions";
import MetaHubLayout from "./MetaHubLayout";
import MetaLinkResourcePanel from "./MetaLinkResourcePanel";
import MetaWebhookBadge from "./MetaWebhookBadge";

function UnlinkPageAction({ id }: { id: string }) {
  const mutation = useAppMutation({
    mutationFn: () => unlinkMetaPageAction(id),
    successMessage: "Página desvinculada",
    invalidateKeys: [queryKeys.metaPagesVinculadasAll, queryKeys.metaPagesAvailable, queryKeys.metaConnection],
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

export default function MetaPagesListView() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.metaPagesVinculadas({ page }),
    queryFn: () => getMetaPagesVinculadas(page),
  });

  const pages = data?.data ?? [];

  return (
    <MetaHubLayout
      title="Páginas de Meta"
      description="Cada página conectada recibe leads de Facebook/Instagram Lead Ads de forma independiente."
    >
      <div className="space-y-6">
        <MetaLinkResourcePanel
          title="Agregar página"
          icon="mdi:facebook"
          loadingLabel="Cargando páginas disponibles…"
          emptyMessage="No hay páginas nuevas por vincular"
          queryKey={queryKeys.metaPagesAvailable}
          queryFn={() => getMetaPagesAvailable()}
          onLink={(item) => linkMetaPageAction(item.id, item.nombre)}
          successMessage="Página vinculada"
          invalidateKeys={[queryKeys.metaPagesVinculadasAll, queryKeys.metaPagesAvailable, queryKeys.metaConnection]}
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
                  itemLabel="páginas"
                />
              ) : undefined
            }
          >
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className={thClass}>
                    Página
                  </TableCell>
                  <TableCell isHeader className={thClass}>
                    Webhook
                  </TableCell>
                  <TableCell isHeader className={thClassEnd}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pages.length === 0 && (
                  <EmptyState
                    colSpan={3}
                    icon="mdi:facebook"
                    title="No hay páginas vinculadas"
                    description="Agrega una página para empezar a recibir leads."
                  />
                )}
                {pages.map((pagina) => (
                  <TableRow key={pagina.id}>
                    <TableCell className={tdPrimaryClass}>
                      <Link href={`/settings/meta/pages/${pagina.id}`}>
                        <EntityCell
                          name={pagina.nombre}
                          subtitle={pagina.pageId}
                          src={pagina.fotoUrl}
                          icon="mdi:facebook"
                          size="sm"
                        />
                      </Link>
                    </TableCell>
                    <TableCell className={tdClass}>
                      <MetaWebhookBadge suscrito={pagina.webhookSuscrito} />
                    </TableCell>
                    <TableCell className={`${tdClass} text-end`}>
                      <div className="inline-flex items-center gap-1">
                        <TableAction
                          href={`/settings/meta/pages/${pagina.id}`}
                          icon="mdi:eye-outline"
                          label="Ver perfil"
                        />
                        <UnlinkPageAction id={pagina.id} />
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

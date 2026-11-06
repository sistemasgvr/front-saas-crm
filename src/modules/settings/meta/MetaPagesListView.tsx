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
import { getMetaPagesAvailable, getMetaPagesVinculadas } from "./queries";
import { linkMetaPageAction as linkMetaPageActionResult, unlinkMetaPageAction as unlinkMetaPageActionResult } from "./actions";
import MetaHubLayout from "./MetaHubLayout";
import MetaLinkResourceModal from "./MetaLinkResourceModal";
import MetaLeadSourceToggle from "./MetaLeadSourceToggle";
import MetaWebhookBadge from "./MetaWebhookBadge";
import { unwrapServerAction } from "@/src/lib/action-result";
const linkMetaPageAction = unwrapServerAction(linkMetaPageActionResult);
const unlinkMetaPageAction = unwrapServerAction(unlinkMetaPageActionResult);


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
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    />
  );
}

export default function MetaPagesListView() {
  const [page, setPage] = useState(1);
  const [vincularAbierto, setVincularAbierto] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.metaPagesVinculadas({ page }),
    queryFn: () => getMetaPagesVinculadas(page),
  });

  const pages = data?.data ?? [];
  const paginacion =
    data && data.total > 0 ? (
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        totalPages={data.totalPages}
        onPageChange={setPage}
        itemLabel="páginas"
      />
    ) : undefined;

  return (
    <MetaHubLayout
      title="Páginas de Meta"
      description="Cada página conectada recibe leads de Facebook/Instagram Lead Ads de forma independiente."
      headerActions={
        <Button
          size="sm"
          startIcon={<Icon name="mdi:link-plus" size={18} />}
          onClick={() => setVincularAbierto(true)}
        >
          Vincular página
        </Button>
      }
    >
      <MetaLinkResourceModal
        open={vincularAbierto}
        onClose={() => setVincularAbierto(false)}
        title="Vincular página"
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
        <>
        <div className="space-y-3 md:hidden">
          {pages.length === 0 ? (
            <TableCard>
              <EmptyState
                icon="mdi:facebook"
                title="No hay páginas vinculadas"
                description="Usa «Vincular página» para empezar a recibir leads."
              />
            </TableCard>
          ) : (
            pages.map((pagina) => (
              <MobileCard
                key={pagina.id}
                header={
                  <Link href={`/settings/meta/pages/${pagina.id}`}>
                    <EntityCell
                      name={pagina.nombre}
                      subtitle={pagina.pageId}
                      src={pagina.fotoUrl}
                      icon="mdi:facebook"
                      size="md"
                    />
                  </Link>
                }
                aside={<MetaWebhookBadge suscrito={pagina.webhookSuscrito} />}
                fields={[
                  {
                    label: "Leads automáticos",
                    value: <MetaLeadSourceToggle tipo="paginas" id={pagina.id} nombre={pagina.nombre} />,
                  },
                ]}
                actions={
                  <>
                    <TableAction href={`/settings/meta/pages/${pagina.id}`} icon="mdi:eye-outline" label="Ver perfil" />
                    <UnlinkPageAction id={pagina.id} />
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
                  Página
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Webhook
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Leads automáticos
                </TableCell>
                <TableCell isHeader className={thClassEnd}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className={tbodyClass}>
              {pages.length === 0 && (
                <EmptyState
                  colSpan={4}
                  icon="mdi:facebook"
                  title="No hay páginas vinculadas"
                  description="Usa «Vincular página» para empezar a recibir leads."
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
                        size="md"
                      />
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <MetaWebhookBadge suscrito={pagina.webhookSuscrito} />
                  </TableCell>
                  <TableCell className={tdClass}>
                    <MetaLeadSourceToggle tipo="paginas" id={pagina.id} nombre={pagina.nombre} />
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
        </div>
        </>
      )}
    </MetaHubLayout>
  );
}

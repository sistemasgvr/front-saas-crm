"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import { Icon } from "@/src/components/ui/Icon";
import ActionButton from "@/src/components/ui/ActionButton";
import Pagination from "@/src/components/ui/Pagination";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { getNotifications } from "./queries";
import { markAllNotificationsReadAction, markNotificationReadAction } from "./actions";
import { resolverRutaNotificacion, type NotificacionItem } from "./types";

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" });
}

export default function NotificationsListView() {
  const [page, setPage] = useState(1);
  const router = useRouter();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.notifications({ page }),
    queryFn: () => getNotifications(page),
  });

  const marcarLeida = useAppMutation({
    mutationFn: (id: string) => markNotificationReadAction(id),
    invalidateKeys: [queryKeys.notificationsAll, queryKeys.notificationsUnreadCount],
  });

  function abrirNotificacion(item: NotificacionItem) {
    if (!item.leida) marcarLeida.mutate(item.id);
    const ruta = resolverRutaNotificacion(item.payload);
    if (ruta) router.push(ruta);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Notificaciones</h1>
        <ActionButton
          action={() => markAllNotificationsReadAction()}
          successMessage="Notificaciones marcadas como leídas"
          loadingText="Marcando…"
          variant="outline"
          size="sm"
          invalidateKeys={[queryKeys.notificationsAll, queryKeys.notificationsUnreadCount]}
        >
          Marcar todas como leídas
        </ActionButton>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <QueryError error={error} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                      Notificación
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                      Fecha
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                      Estado
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data?.data.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-theme-sm text-gray-500">
                        No hay notificaciones.
                      </td>
                    </tr>
                  )}
                  {(data?.data ?? []).map((item) => (
                    <TableRow
                      key={item.id}
                      onClick={() => abrirNotificacion(item)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <TableCell className="px-5 py-4">
                        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{item.titulo}</p>
                        <p className="text-theme-xs text-gray-500">{item.mensaje}</p>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-theme-sm text-gray-500">
                        {formatearFecha(item.fechaCreacion)}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        {item.leida ? (
                          <span className="text-theme-xs text-gray-400">Leída</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-theme-xs font-medium text-brand-500">
                            <Icon name="mdi:circle" size={8} />
                            Nueva
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {data && (
              <div className="px-5 py-4">
                <Pagination
                  page={data.page}
                  pageSize={data.pageSize}
                  total={data.total}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                  itemLabel="notificaciones"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

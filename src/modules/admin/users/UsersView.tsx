"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import Badge, { StatusBadge } from "@/src/components/ui/badge/Badge";
import EmptyState from "@/src/components/ui/EmptyState";
import PageHeader from "@/src/components/ui/PageHeader";
import Pagination from "@/src/components/ui/Pagination";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import TableCard, { tdClass, tdPrimaryClass, thClass, thClassEnd } from "@/src/components/ui/TableCard";
import { queryKeys } from "@/src/lib/query/keys";
import { getAdminUsers } from "./queries";

const PAGE_SIZE = 20;

export default function UsersView() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.adminUsers({ page, pageSize: PAGE_SIZE }),
    queryFn: () => getAdminUsers({ page, pageSize: PAGE_SIZE }),
  });
  const users = data?.data ?? [];

  if (isLoading) return <PageLoader />;
  if (isError) return <QueryError error={error} />;

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Cuentas de la plataforma y de empresas cliente."
        action={{ href: "/admin/users/new", label: "Nuevo usuario", icon: "mdi:account-plus" }}
      />
      <TableCard
        footer={
          data ? (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={setPage}
              itemLabel="usuarios"
            />
          ) : null
        }
      >
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className={thClass}>
                Usuario
              </TableCell>
              <TableCell isHeader className={thClass}>
                Tipo
              </TableCell>
              <TableCell isHeader className={thClass}>
                Estado
              </TableCell>
              <TableCell isHeader className={thClassEnd}>
                Acción
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.length === 0 && (
              <EmptyState colSpan={4} icon="mdi:account-group-outline" title="No hay usuarios registrados." />
            )}
            {users.map((user) => {
              const fullName = `${user.nombre} ${user.apellido ?? ""}`.trim();
              return (
                <TableRow key={user.id}>
                  <TableCell className={tdPrimaryClass}>
                    <EntityCell name={fullName} subtitle={user.email} />
                  </TableCell>
                  <TableCell className={tdClass}>
                    <Badge size="sm" color={user.esAdminPlataforma ? "info" : "light"}>
                      {user.esAdminPlataforma ? "Plataforma" : "Cliente"}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <StatusBadge active={user.estado === 1} />
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex justify-end">
                      <TableAction
                        href={`/admin/users/${user.id}`}
                        icon="mdi:cog-outline"
                        label={`Gestionar ${fullName}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
}

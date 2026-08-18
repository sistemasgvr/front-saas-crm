"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import Badge, { StatusBadge } from "@/src/components/ui/badge/Badge";
import EmptyState from "@/src/components/ui/EmptyState";
import DynamicFilters from "@/src/components/ui/filters/DynamicFilters";
import type { DynamicFilterFieldDef, DynamicFilterValues } from "@/src/components/ui/filters/types";
import PageHeader from "@/src/components/ui/PageHeader";
import Pagination from "@/src/components/ui/Pagination";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import TableCard, { tdClass, tdPrimaryClass, thClass, thClassEnd } from "@/src/components/ui/TableCard";
import { queryKeys } from "@/src/lib/query/keys";
import { getAdminUsers } from "./queries";

const PAGE_SIZE = 20;

const FIELDS: DynamicFilterFieldDef[] = [
  { key: "q", label: "Buscar", type: "text", placeholder: "Nombre, email o teléfono" },
  {
    key: "tipo",
    label: "Tipo",
    type: "select",
    placeholder: "Todos",
    options: [
      { value: "0", label: "Cliente" },
      { value: "1", label: "Plataforma" },
    ],
  },
  {
    key: "estado",
    label: "Estado",
    type: "select",
    placeholder: "Todos",
    options: [
      { value: "1", label: "Activos" },
      { value: "0", label: "Inactivos" },
    ],
  },
];

function toFlag(value: string | undefined): 0 | 1 | undefined {
  if (value === "0") return 0;
  if (value === "1") return 1;
  return undefined;
}

export default function UsersView() {
  const [values, setValues] = useState<DynamicFilterValues>({ estado: "1" });
  const [page, setPage] = useState(1);
  const deferredQ = useDeferredValue(values.q ?? "");

  const filtro = {
    page,
    pageSize: PAGE_SIZE,
    q: deferredQ.trim() || undefined,
    estado: toFlag(values.estado),
    esAdminPlataforma: toFlag(values.tipo),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.adminUsers(filtro),
    queryFn: () => getAdminUsers(filtro),
  });
  const users = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Cuentas de la plataforma y de empresas cliente."
        action={{ href: "/admin/users/new", label: "Nuevo usuario", icon: "mdi:account-plus" }}
      >
        <DynamicFilters
          fields={FIELDS}
          values={values}
          onChange={(next) => {
            setValues(next);
            setPage(1);
          }}
        />
      </PageHeader>

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
                <EmptyState
                  colSpan={4}
                  icon="mdi:account-group-outline"
                  title="No hay usuarios con estos filtros."
                  description="Prueba otra búsqueda o cambia tipo y estado."
                />
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
      )}
    </div>
  );
}

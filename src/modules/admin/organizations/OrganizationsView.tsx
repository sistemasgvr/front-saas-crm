"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import { StatusBadge } from "@/src/components/ui/badge/Badge";
import EmptyState from "@/src/components/ui/EmptyState";
import DynamicFilters from "@/src/components/ui/filters/DynamicFilters";
import type { DynamicFilterFieldDef, DynamicFilterValues } from "@/src/components/ui/filters/types";
import PageHeader from "@/src/components/ui/PageHeader";
import Pagination from "@/src/components/ui/Pagination";
import { QueryError } from "@/src/components/ui/PageLoader";
import { TableRowsSkeleton } from "@/src/components/ui/skeletons";
import TableAction from "@/src/components/ui/TableAction";
import TableCard, { tdClass, tdPrimaryClass, thClass, thClassEnd } from "@/src/components/ui/TableCard";
import { queryKeys } from "@/src/lib/query/keys";
import { getAdminOrganizations } from "./queries";

const PAGE_SIZE = 20;

const FIELDS: DynamicFilterFieldDef[] = [
  { key: "q", label: "Buscar", type: "text", placeholder: "Nombre, slug, RUC o email" },
  {
    key: "estado",
    label: "Estado",
    type: "select",
    placeholder: "Todas",
    options: [
      { value: "1", label: "Activas" },
      { value: "0", label: "Desactivadas" },
    ],
  },
];

function toEstado(value: string | undefined): 0 | 1 | undefined {
  if (value === "0") return 0;
  if (value === "1") return 1;
  return undefined;
}

export default function OrganizationsView() {
  const [values, setValues] = useState<DynamicFilterValues>({ estado: "1" });
  const [page, setPage] = useState(1);
  const deferredQ = useDeferredValue(values.q ?? "");

  const filtro = {
    page,
    pageSize: PAGE_SIZE,
    q: deferredQ.trim() || undefined,
    estado: toEstado(values.estado),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.adminOrganizations(filtro),
    queryFn: () => getAdminOrganizations(filtro),
  });
  const orgs = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Organizaciones cliente de la plataforma."
        action={{ href: "/admin/organizations/new", label: "Nueva empresa", icon: "mdi:domain-plus" }}
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
        <TableRowsSkeleton rows={8} cols={4} />
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
                itemLabel="empresas"
              />
            ) : null
          }
        >
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={thClass}>
                  Empresa
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
              {orgs.length === 0 && (
                <EmptyState
                  colSpan={3}
                  icon="mdi:office-building-outline"
                  title="No hay empresas con estos filtros."
                  description="Prueba otra búsqueda o cambia el estado."
                />
              )}
              {orgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className={tdPrimaryClass}>
                    <EntityCell
                      name={org.nombre}
                      subtitle={org.slug}
                      src={org.logoUrl}
                      shape="rounded"
                      icon="mdi:office-building-outline"
                    />
                  </TableCell>
                  <TableCell className={tdClass}>
                    <StatusBadge active={org.estado === 1} activeLabel="Activa" inactiveLabel="Desactivada" />
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex justify-end">
                      <TableAction
                        href={`/admin/organizations/${org.id}`}
                        icon="mdi:eye-outline"
                        label={`Ver ${org.nombre}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}

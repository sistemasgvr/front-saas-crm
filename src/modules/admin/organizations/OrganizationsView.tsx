"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import Button from "@/src/components/ui/button/Button";
import Pagination from "@/src/components/ui/Pagination";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { getAdminOrganizations } from "./queries";

const PAGE_SIZE = 20;

export default function OrganizationsView() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.adminOrganizations({ page, pageSize: PAGE_SIZE }),
    queryFn: () => getAdminOrganizations({ page, pageSize: PAGE_SIZE }),
  });
  const orgs = data?.data ?? [];

  if (isLoading) return <PageLoader />;
  if (isError) return <QueryError error={error} />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Empresas</h1>
        <Link href="/admin/organizations/new">
          <Button size="sm">Nueva empresa</Button>
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Nombre
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Slug
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Estado
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Acción
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-theme-sm text-gray-500">
                    No hay empresas registradas.
                  </td>
                </tr>
              )}
              {orgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90">{org.nombre}</TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500">{org.slug}</TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm">
                    {org.estado === 1 ? "Activa" : "Desactivada"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Link href={`/admin/organizations/${org.id}`} className="text-theme-sm text-brand-500">
                      Ver
                    </Link>
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
              itemLabel="empresas"
            />
          </div>
        )}
      </div>
    </div>
  );
}

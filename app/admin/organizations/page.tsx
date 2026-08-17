import Link from "next/link";
import { apiFetch } from "@/src/lib/api";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import Button from "@/src/components/ui/button/Button";
import type { OrganizacionAdmin } from "@/src/modules/admin/types";

export default async function AdminOrganizationsPage() {
  const orgs = await apiFetch<OrganizacionAdmin[]>("/admin/organizations");

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
      </div>
    </div>
  );
}

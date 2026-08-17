import Link from "next/link";
import { apiFetch } from "@/src/lib/api";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import Button from "@/src/components/ui/button/Button";
import type { UsuarioAdmin } from "@/src/modules/admin/types";

export default async function AdminUsersPage() {
  const users = await apiFetch<UsuarioAdmin[]>("/admin/users");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Usuarios</h1>
        <Link href="/admin/users/new">
          <Button size="sm">Nuevo usuario</Button>
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
                  Email
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500">
                  Tipo
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
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90">
                    {user.nombre} {user.apellido ?? ""}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500">{user.email}</TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm">
                    {user.esAdminPlataforma ? "Plataforma" : "Cliente"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm">{user.estado === 1 ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell className="px-5 py-4">
                    <Link href={`/admin/users/${user.id}`} className="text-theme-sm text-brand-500">
                      Gestionar
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

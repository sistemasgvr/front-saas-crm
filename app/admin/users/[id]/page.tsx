import { apiFetch } from "@/src/lib/api";
import Button from "@/src/components/ui/button/Button";
import AssignOrgForm from "@/src/modules/admin/users/AssignOrgForm";
import { toggleUserStatusAction } from "@/src/modules/admin/users/actions";
import type { OrganizacionAdmin, UsuarioAdminDetalle } from "@/src/modules/admin/types";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, organizaciones] = await Promise.all([
    apiFetch<UsuarioAdminDetalle>(`/admin/users/${id}`),
    apiFetch<OrganizacionAdmin[]>("/admin/organizations"),
  ]);

  const nextEstado = user.estado === 1 ? 0 : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            {user.nombre} {user.apellido ?? ""}
          </h1>
          <p className="text-theme-sm text-gray-500">{user.email}</p>
        </div>
        <form action={toggleUserStatusAction.bind(null, user.id, nextEstado)}>
          <Button type="submit" size="sm" variant="outline">
            {user.estado === 1 ? "Desactivar" : "Activar"}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Membresías</h2>
        {user.organizaciones.length === 0 ? (
          <p className="mb-4 text-theme-sm text-gray-500">Sin empresas asignadas.</p>
        ) : (
          <ul className="mb-5 divide-y divide-gray-100 dark:divide-gray-800">
            {user.organizaciones.map((m) => (
              <li key={m.organizacionId} className="flex justify-between py-3 text-theme-sm">
                <span className="text-gray-800 dark:text-white/90">{m.organizacionNombre}</span>
                <span className="text-gray-500">{m.rol}</span>
              </li>
            ))}
          </ul>
        )}
        <AssignOrgForm userId={user.id} organizaciones={organizaciones} />
      </div>
    </div>
  );
}

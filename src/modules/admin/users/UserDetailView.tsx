"use client";

import { useQuery } from "@tanstack/react-query";
import ActionButton from "@/src/components/ui/ActionButton";
import Avatar from "@/src/components/ui/avatar/Avatar";
import Badge, { StatusBadge } from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import AssignOrgForm from "./AssignOrgForm";
import { toggleUserStatusAction } from "./actions";
import { getAdminUser } from "./queries";
import { getAdminOrganizations } from "../organizations/queries";

export default function UserDetailView({ id }: { id: string }) {
  const userQuery = useQuery({
    queryKey: queryKeys.adminUser(id),
    queryFn: () => getAdminUser(id),
  });
  const orgsQuery = useQuery({
    queryKey: queryKeys.adminOrganizations({ page: 1, pageSize: 100 }),
    queryFn: () => getAdminOrganizations({ page: 1, pageSize: 100 }),
  });

  if (userQuery.isLoading) return <PageLoader />;
  if (userQuery.isError) return <QueryError error={userQuery.error} />;
  if (!userQuery.data) return null;

  const user = userQuery.data;
  const nextEstado = user.estado === 1 ? 0 : 1;
  const isActive = user.estado === 1;
  const fullName = `${user.nombre} ${user.apellido ?? ""}`.trim();

  return (
    <div className="space-y-6">
      <PageHeader title={fullName} description={user.email} backHref="/admin/users" backLabel="Volver a usuarios">
        <ActionButton
          action={() => toggleUserStatusAction(user.id, nextEstado)}
          successMessage={isActive ? "Usuario desactivado" : "Usuario activado"}
          loadingText={isActive ? "Desactivando…" : "Activando…"}
          startIcon={<Icon name={isActive ? "mdi:account-off-outline" : "mdi:account-check-outline"} size={18} />}
          invalidateKeys={[queryKeys.adminUsersAll, queryKeys.adminUser(user.id)]}
        >
          {isActive ? "Desactivar" : "Activar"}
        </ActionButton>
      </PageHeader>

      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <Avatar name={fullName} size="xl" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-gray-800 dark:text-white/90">{fullName}</p>
          <p className="truncate text-theme-sm text-gray-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge size="sm" color={user.esAdminPlataforma ? "info" : "light"}>
              {user.esAdminPlataforma ? "Plataforma" : "Cliente"}
            </Badge>
            <StatusBadge active={isActive} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Membresías</h2>
        {user.organizaciones.length === 0 ? (
          <p className="mb-4 text-theme-sm text-gray-500">Sin empresas asignadas.</p>
        ) : (
          <ul className="mb-5 divide-y divide-gray-100 dark:divide-gray-800">
            {user.organizaciones.map((m) => (
              <li key={m.organizacionId} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={m.organizacionNombre} shape="rounded" size="sm" icon="mdi:office-building-outline" />
                  <span className="truncate text-theme-sm text-gray-800 dark:text-white/90">{m.organizacionNombre}</span>
                </div>
                <Badge size="sm" color="light">
                  {m.rol}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <AssignOrgForm
          key={user.organizaciones.map((m) => `${m.organizacionId}:${m.rol}`).join("|")}
          userId={user.id}
          organizaciones={orgsQuery.data?.data ?? []}
          membresias={user.organizaciones}
          cargandoEmpresas={orgsQuery.isLoading}
        />
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import ActionButton from "@/src/components/ui/ActionButton";
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
    queryKey: queryKeys.adminOrganizations,
    queryFn: () => getAdminOrganizations(),
  });

  if (userQuery.isLoading) return <PageLoader />;
  if (userQuery.isError) return <QueryError error={userQuery.error} />;
  if (!userQuery.data) return null;

  const user = userQuery.data;
  const nextEstado = user.estado === 1 ? 0 : 1;
  const isActive = user.estado === 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            {user.nombre} {user.apellido ?? ""}
          </h1>
          <p className="text-theme-sm text-gray-500">{user.email}</p>
        </div>
        <ActionButton
          action={() => toggleUserStatusAction(user.id, nextEstado)}
          successMessage={isActive ? "Usuario desactivado" : "Usuario activado"}
          loadingText={isActive ? "Desactivando…" : "Activando…"}
          invalidateKeys={[queryKeys.adminUsers, queryKeys.adminUser(user.id)]}
        >
          {isActive ? "Desactivar" : "Activar"}
        </ActionButton>
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
        <AssignOrgForm
          key={user.organizaciones.map((m) => `${m.organizacionId}:${m.rol}`).join("|")}
          userId={user.id}
          organizaciones={Array.isArray(orgsQuery.data) ? orgsQuery.data : []}
          membresias={user.organizaciones}
          cargandoEmpresas={orgsQuery.isLoading}
        />
      </div>
    </div>
  );
}

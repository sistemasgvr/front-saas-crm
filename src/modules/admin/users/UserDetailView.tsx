"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import Badge, { StatusBadge } from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import ConfirmModal from "@/src/components/ui/modal/ConfirmModal";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { unwrapAction } from "@/src/lib/action-result";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import AssignOrgForm from "./AssignOrgForm";
import { toggleUserStatusAction } from "./actions";
import { getAdminUser } from "./queries";
import { getAdminOrganizations } from "../organizations/queries";

export default function UserDetailView({ id }: { id: string }) {
  const [confirmarBaja, setConfirmarBaja] = useState(false);
  const userQuery = useQuery({
    queryKey: queryKeys.adminUser(id),
    queryFn: () => getAdminUser(id),
  });
  const orgsQuery = useQuery({
    queryKey: queryKeys.adminOrganizations({ page: 1, pageSize: 100, estado: 1 }),
    queryFn: () => getAdminOrganizations({ page: 1, pageSize: 100, estado: 1 }),
  });
  const cambiarEstado = useAppMutation({
    mutationFn: async (estado: 0 | 1) => {
      unwrapAction(await toggleUserStatusAction(id, estado));
      setConfirmarBaja(false);
    },
    successMessage: "Estado actualizado",
    invalidateKeys: [
      queryKeys.adminUsersAll,
      queryKeys.adminUser(id),
      ["organization-users"],
      queryKeys.leadsAll,
      queryKeys.whatsappChats,
    ],
  });

  if (userQuery.isLoading) return <PageLoader />;
  if (userQuery.isError) return <QueryError error={userQuery.error} />;
  if (!userQuery.data) return null;

  const user = userQuery.data;
  const isActive = user.estado === 1;
  const fullName = `${user.nombre} ${user.apellido ?? ""}`.trim();

  return (
    <div className="space-y-6">
      <PageHeader title={fullName} description={user.email} backHref="/admin/users" backLabel="Volver a usuarios">
        <Button
          size="sm"
          variant="outline"
          loading={cambiarEstado.isPending}
          onClick={() => {
            if (isActive) {
              cambiarEstado.reset();
              setConfirmarBaja(true);
            } else cambiarEstado.mutate(1);
          }}
          startIcon={<Icon name={isActive ? "mdi:account-off-outline" : "mdi:account-check-outline"} size={18} />}
        >
          {isActive ? "Desactivar" : "Activar"}
        </Button>
      </PageHeader>
      <ConfirmModal
        open={confirmarBaja}
        title="Desactivar cuenta"
        description="La cuenta perderá el acceso. Sus leads activos pasarán a Sin asignar en sus empresas y se liberará el control de sus chats."
        confirmLabel="Desactivar"
        variant="danger"
        loading={cambiarEstado.isPending}
        error={cambiarEstado.isError ? cambiarEstado.error.message : undefined}
        onClose={() => {
          if (!cambiarEstado.isPending) setConfirmarBaja(false);
        }}
        onConfirm={() => cambiarEstado.mutate(0)}
      />

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

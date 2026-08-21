"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryKeys } from "@/src/lib/query/keys";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import Button from "@/src/components/ui/button/Button";
import Badge from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";
import ActionButton from "@/src/components/ui/ActionButton";
import { getMetaConnection, getMetaPermissions } from "./queries";
import { connectMetaAction, disconnectMetaAction } from "./actions";
import MetaAppCredentialsForm from "./MetaAppCredentialsForm";
import MetaHubLayout from "./MetaHubLayout";
import MetaPermissionsPanel from "./MetaPermissionsPanel";
import MetaStatCard from "./MetaStatCard";
import { formatearFechaMeta } from "./format";

export default function MetaHubView({ metaCallback }: { metaCallback?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!metaCallback) return;
    if (metaCallback === "connected") {
      toast.success("Meta conectado correctamente");
    } else if (metaCallback === "error") {
      toast.error("No se pudo conectar con Meta. Intenta de nuevo.");
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.metaConnection });
    router.replace("/settings/meta");
  }, [metaCallback, queryClient, router]);

  const connectionQuery = useQuery({
    queryKey: queryKeys.metaConnection,
    queryFn: () => getMetaConnection(),
  });
  const connection = connectionQuery.data;

  // Mismo queryKey que MetaPermissionsPanel — comparte caché, no duplica el fetch.
  const permissionsQuery = useQuery({
    queryKey: queryKeys.metaPermissions,
    queryFn: () => getMetaPermissions(),
    enabled: Boolean(connection?.appConfigurada && connection.conectado),
  });
  const permisosFaltantes = permissionsQuery.data?.ok
    ? permissionsQuery.data.data.features.filter((f) => f.deseada && f.estado === "falta").length
    : 0;

  if (connectionQuery.isLoading) {
    return (
      <MetaHubLayout
        title="Meta"
        description="Conexión, páginas y cuentas publicitarias de Facebook/Instagram Lead Ads."
      >
        <PageLoader label="Cargando conexión Meta…" />
      </MetaHubLayout>
    );
  }

  if (connectionQuery.isError) {
    return (
      <MetaHubLayout
        title="Meta"
        description="Conexión, páginas y cuentas publicitarias de Facebook/Instagram Lead Ads."
      >
        <QueryError error={connectionQuery.error} />
      </MetaHubLayout>
    );
  }

  if (!connection) return null;

  return (
    <MetaHubLayout
      title="Meta"
      description="Conexión, páginas y cuentas publicitarias de Facebook/Instagram Lead Ads."
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-5 flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15">
            <Icon name="mdi:facebook" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Conexión Meta</h2>
              {connection.appConfigurada && (
                <Badge color={connection.conectado ? "success" : "warning"} size="sm">
                  {connection.conectado ? "Conectado" : "Pendiente"}
                </Badge>
              )}
              {permisosFaltantes > 0 && (
                <Badge color="error" size="sm">
                  {permisosFaltantes} {permisosFaltantes === 1 ? "permiso faltante" : "permisos faltantes"}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              Administra credenciales, OAuth y recursos vinculados de Lead Ads.
            </p>
          </div>
        </div>

        {!connection.appConfigurada && <MetaAppCredentialsForm />}

        {connection.appConfigurada && !connection.conectado && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p className="text-theme-sm text-gray-600 dark:text-gray-300">
                Meta App registrada · App ID{" "}
                <span className="font-medium text-gray-800 dark:text-white/90">{connection.appId}</span>
              </p>
              <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
                Conecta tu cuenta de Meta para recibir leads de Facebook/Instagram Lead Ads.
              </p>
            </div>
            <form action={connectMetaAction}>
              <Button type="submit" startIcon={<Icon name="mdi:facebook" size={18} />}>
                Conectar con Meta
              </Button>
            </form>
            <details className="text-theme-xs text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300">
                ¿Necesitas cambiar el App ID o App Secret?
              </summary>
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <MetaAppCredentialsForm appIdActual={connection.appId} />
              </div>
            </details>
          </div>
        )}

        {connection.appConfigurada && connection.conectado && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <Icon name="mdi:account-circle-outline" size={22} className="text-gray-500" />
              <p className="text-theme-sm text-gray-700 dark:text-gray-300">
                Conectado como <span className="font-medium">{connection.metaUserNombre}</span>
              </p>
              {connection.tokenExpiraEn && (
                <span className="text-theme-xs text-gray-500">
                  · Token expira {formatearFechaMeta(connection.tokenExpiraEn)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MetaStatCard label="Páginas activas" value={connection.paginasActivas} icon="mdi:facebook" />
              <MetaStatCard
                label="Cuentas publicitarias activas"
                value={connection.cuentasActivas}
                icon="mdi:bullhorn-outline"
              />
            </div>

            <MetaPermissionsPanel />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <Link href="/settings/meta/pages">
                  <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:facebook" size={18} />}>
                    Gestionar páginas
                  </Button>
                </Link>
                <Link href="/settings/meta/ad-accounts">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    startIcon={<Icon name="mdi:bullhorn-outline" size={18} />}
                  >
                    Gestionar cuentas
                  </Button>
                </Link>
              </div>
              <ActionButton
                action={disconnectMetaAction}
                successMessage="Meta desconectado"
                variant="danger"
                startIcon={<Icon name="mdi:link-off" size={18} />}
                invalidateKeys={[
                  queryKeys.metaConnection,
                  queryKeys.metaPagesVinculadasAll,
                  queryKeys.metaAdAccountsVinculadasAll,
                ]}
              >
                Desconectar Meta
              </ActionButton>
            </div>
          </div>
        )}
      </div>
    </MetaHubLayout>
  );
}

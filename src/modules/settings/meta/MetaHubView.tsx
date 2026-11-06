"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryKeys } from "@/src/lib/query/keys";
import ComponentCard from "@/src/components/common/ComponentCard";
import { InfoGrid, InfoItem } from "@/src/components/common/InfoItem";
import MetricCard from "@/src/components/common/MetricCard";
import Alert from "@/src/components/ui/alert/Alert";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import Button from "@/src/components/ui/button/Button";
import Badge from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";
import ActionButton from "@/src/components/ui/ActionButton";
import { getMetaConnection, getMetaPermissions } from "./queries";
import { connectMetaAction as connectMetaActionResult, disconnectMetaAction as disconnectMetaActionResult } from "./actions";
import MetaAppCredentialsForm from "./MetaAppCredentialsForm";
import MetaCapiSettingsForm from "./MetaCapiSettingsForm";
import MetaHubLayout from "./MetaHubLayout";
import MetaPermissionsPanel from "./MetaPermissionsPanel";
import { formatearFechaMeta } from "./format";
import { unwrapServerAction } from "@/src/lib/action-result";
import { withFormFeedback } from "@/src/lib/form-action";
const connectMetaAction = unwrapServerAction(connectMetaActionResult);
const disconnectMetaAction = unwrapServerAction(disconnectMetaActionResult);


export default function MetaHubView({ metaCallback }: { metaCallback?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!metaCallback) return;
    if (metaCallback === "connected") {
      toast.success("Meta conectado correctamente. Revisa el estado en Permisos Meta.");
    } else if (metaCallback === "denied") {
      toast.warning("Cancelaste el diálogo de Meta: no se otorgaron permisos nuevos.");
    } else if (metaCallback === "error") {
      toast.error("No se pudo conectar con Meta. Intenta de nuevo.");
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.metaConnection });
    void queryClient.invalidateQueries({ queryKey: queryKeys.metaPermissions });
    void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappConexiones });
    void queryClient.invalidateQueries({ queryKey: ["whatsappCoexistenciaConfig"] });
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
      <div data-tour="meta-settings" className="space-y-6">
        <ComponentCard
          title="Conexión Meta"
          desc="Administra credenciales, OAuth y recursos vinculados de Lead Ads."
          badges={
            <>
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
            </>
          }
          actions={
            connection.appConfigurada && connection.conectado ? (
              <ActionButton
                action={disconnectMetaAction}
                successMessage="Meta desconectado"
                variant="danger"
                startIcon={<Icon name="mdi:link-off" size={18} />}
                invalidateKeys={[
                  queryKeys.metaConnection,
                  queryKeys.metaPermissions,
                  queryKeys.metaPagesVinculadasAll,
                  queryKeys.metaAdAccountsVinculadasAll,
                  queryKeys.whatsappConexiones,
                  ["whatsappCoexistenciaConfig"],
                ]}
              >
                Desconectar Meta
              </ActionButton>
            ) : undefined
          }
        >
          {!connection.appConfigurada && <MetaAppCredentialsForm />}

          {connection.appConfigurada && !connection.conectado && (
            <>
              <InfoGrid>
                <InfoItem label="Meta App registrada">App ID {connection.appId}</InfoItem>
              </InfoGrid>
              <Alert
                variant="info"
                message="Conecta tu cuenta de Meta para recibir leads de Facebook/Instagram Lead Ads. Se solicitan de una vez todos los permisos que usa el CRM; acepta todos y selecciona tus páginas, cuentas publicitarias, portafolio y, si usas WhatsApp, tus cuentas de WhatsApp."
              />
              <form action={withFormFeedback(connectMetaAction)}>
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
            </>
          )}

          {connection.appConfigurada && connection.conectado && (
            <>
              <InfoGrid>
                <InfoItem label="Conectado como">{connection.metaUserNombre ?? "—"}</InfoItem>
                <InfoItem label="Token expira">{formatearFechaMeta(connection.tokenExpiraEn)}</InfoItem>
                <InfoItem label="App ID">{connection.appId ?? "—"}</InfoItem>
              </InfoGrid>
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
            </>
          )}
        </ComponentCard>

        {connection.appConfigurada && connection.conectado && (
          <>
            <div className="grid grid-cols-2 gap-2 lg:gap-3">
              <MetricCard label="Páginas activas" value={connection.paginasActivas} icon="mdi:facebook" />
              <MetricCard
                label="Cuentas publicitarias activas"
                value={connection.cuentasActivas}
                icon="mdi:bullhorn-outline"
              />
            </div>

            <MetaPermissionsPanel />

            <MetaCapiSettingsForm capiDatasetIdActual={connection.capiDatasetId} />
          </>
        )}
      </div>
    </MetaHubLayout>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import { Icon } from "@/src/components/ui/Icon";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { getMetaConnection } from "./queries";

export default function MetaSettingsEntryCard() {
  const connectionQuery = useQuery({
    queryKey: queryKeys.metaConnection,
    queryFn: () => getMetaConnection(),
  });

  if (connectionQuery.isLoading) {
    return (
      <CollapsibleSection title="Meta Lead Ads" icon="mdi:facebook">
        <PageLoader label="Cargando Meta…" />
      </CollapsibleSection>
    );
  }

  if (connectionQuery.isError) {
    return (
      <CollapsibleSection title="Meta Lead Ads" icon="mdi:facebook">
        <QueryError error={connectionQuery.error} />
      </CollapsibleSection>
    );
  }

  const connection = connectionQuery.data;
  if (!connection) return null;

  const conectado = connection.appConfigurada && connection.conectado;
  const configurado = connection.appConfigurada;
  const estado = conectado ? "Conectado" : configurado ? "Sin conectar" : "Sin configurar";
  const preview = conectado
    ? `${connection.metaUserNombre} · ${connection.paginasActivas} páginas · ${connection.cuentasActivas} cuentas`
    : configurado
      ? "App registrada. Completa la conexión OAuth."
      : "Configura tu Meta App y conecta páginas.";

  return (
    <CollapsibleSection
      title="Meta Lead Ads"
      icon="mdi:facebook"
      help="Conecta Facebook/Instagram Lead Ads para recibir leads nuevos en el CRM."
      preview={preview}
      badge={estado}
      badgeColor={conectado ? "success" : configurado ? "warning" : "light"}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Badge color={conectado ? "success" : configurado ? "warning" : "light"} size="sm">
          {estado}
        </Badge>
        <Link href="/settings/meta" className="shrink-0">
          <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:cog-outline" size={18} />}>
            Gestionar Meta
          </Button>
        </Link>
      </div>
    </CollapsibleSection>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <PageLoader label="Cargando Meta…" />
      </div>
    );
  }

  if (connectionQuery.isError) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <QueryError error={connectionQuery.error} />
      </div>
    );
  }

  const connection = connectionQuery.data;
  if (!connection) return null;

  const conectado = connection.appConfigurada && connection.conectado;
  const configurado = connection.appConfigurada;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15">
            <Icon name="mdi:facebook" size={24} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Meta Lead Ads</h2>
              <Badge color={conectado ? "success" : configurado ? "warning" : "light"} size="sm">
                {conectado ? "Conectado" : configurado ? "Sin conectar" : "Sin configurar"}
              </Badge>
            </div>
            <p className="mt-1 max-w-xl text-theme-sm text-gray-500 dark:text-gray-400">
              {conectado
                ? `${connection.metaUserNombre} · ${connection.paginasActivas} páginas · ${connection.cuentasActivas} cuentas publicitarias`
                : configurado
                  ? "App registrada. Completa la conexión OAuth y vincula páginas y cuentas."
                  : "Configura tu Meta App y conecta páginas para recibir leads."}
            </p>
          </div>
        </div>
        <Link href="/settings/meta" className="shrink-0">
          <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:cog-outline" size={18} />}>
            Gestionar Meta
          </Button>
        </Link>
      </div>
    </div>
  );
}

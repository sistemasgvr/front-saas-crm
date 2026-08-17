"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import Button from "@/src/components/ui/button/Button";
import ActionButton from "@/src/components/ui/ActionButton";
import Select from "@/src/components/form/Select";
import Label from "@/src/components/form/Label";
import { getMetaAdAccounts, getMetaConnection, getMetaPages } from "./queries";
import { connectMetaAction, disconnectMetaAction, selectMetaAdAccountAction, selectMetaPageAction } from "./actions";
import { isMetaConnectionConfigured } from "./types";
import MetaAppCredentialsForm from "./MetaAppCredentialsForm";

export default function MetaConnectionCard({ metaCallback }: { metaCallback?: string }) {
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
    router.replace("/settings");
  }, [metaCallback, queryClient, router]);

  const connectionQuery = useQuery({
    queryKey: queryKeys.metaConnection,
    queryFn: () => getMetaConnection(),
  });
  const connection = connectionQuery.data;
  const connectedMeta =
    isMetaConnectionConfigured(connection) && connection.conectado ? connection : null;
  const isConnected = connectedMeta !== null;

  const [selectedPage, setSelectedPage] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");

  useEffect(() => {
    if (connectedMeta?.pageId) setSelectedPage(connectedMeta.pageId);
  }, [connectedMeta?.pageId]);

  useEffect(() => {
    if (connectedMeta?.adAccountId) setSelectedAccount(connectedMeta.adAccountId);
  }, [connectedMeta?.adAccountId]);

  const pagesQuery = useQuery({
    queryKey: queryKeys.metaPages,
    queryFn: () => getMetaPages(),
    enabled: isConnected,
  });
  const accountsQuery = useQuery({
    queryKey: queryKeys.metaAdAccounts,
    queryFn: () => getMetaAdAccounts(),
    enabled: isConnected,
  });

  const pageChanged = Boolean(selectedPage && selectedPage !== connectedMeta?.pageId);
  const accountChanged = Boolean(selectedAccount && selectedAccount !== connectedMeta?.adAccountId);

  const selectPage = useAppMutation({
    mutationFn: () => {
      const pagina = pagesQuery.data?.find((p) => p.id === selectedPage);
      if (!pagina) throw new Error("Selecciona una página");
      return selectMetaPageAction(pagina.id, pagina.nombre);
    },
    successMessage: "Página actualizada",
    invalidateKeys: [queryKeys.metaConnection],
  });

  const selectAccount = useAppMutation({
    mutationFn: () => {
      const cuenta = accountsQuery.data?.find((a) => a.id === selectedAccount);
      if (!cuenta) throw new Error("Selecciona una cuenta publicitaria");
      return selectMetaAdAccountAction(cuenta.id, cuenta.nombre);
    },
    successMessage: "Cuenta publicitaria actualizada",
    invalidateKeys: [queryKeys.metaConnection],
  });

  if (connectionQuery.isLoading) return <PageLoader label="Cargando conexión Meta…" />;
  if (connectionQuery.isError) return <QueryError error={connectionQuery.error} />;
  if (!connection) return null;

  const pageOptions = (pagesQuery.data ?? []).map((p) => ({ value: p.id, label: p.nombre }));
  const accountOptions = (accountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.nombre }));

  return (
    <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
      <h2 className="mb-4 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Conexión Meta</h2>

      {!connection.appConfigurada && <MetaAppCredentialsForm />}

      {connection.appConfigurada && !connection.conectado && (
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              Meta App registrada (App ID: <span className="text-gray-800 dark:text-white/90">{connection.appId}</span>
              ). Conecta tu cuenta de Meta para recibir leads de Facebook/Instagram Lead Ads.
            </p>
            <form action={connectMetaAction}>
              <Button type="submit">Conectar Meta</Button>
            </form>
          </div>
          <details className="text-theme-xs text-gray-500 dark:text-gray-400">
            <summary className="cursor-pointer">¿Necesitas cambiar el App ID o App Secret?</summary>
            <div className="mt-3">
              <MetaAppCredentialsForm appIdActual={connection.appId} />
            </div>
          </details>
        </div>
      )}

      {connection.appConfigurada && connection.conectado && connectedMeta && (
        <div className="space-y-5">
          <p className="text-theme-sm text-gray-700 dark:text-gray-300">
            Conectado como <span className="font-medium">{connectedMeta.metaUserNombre}</span>
          </p>

          <div>
            <Label>Página de Facebook</Label>
            <p className="mb-2 text-theme-xs text-gray-500 dark:text-gray-400">
              {connectedMeta.pageNombre
                ? `Actual: ${connectedMeta.pageNombre}. El webhook de leads se enruta por esta página.`
                : "Selecciona la página desde la que recibirás leads."}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Select
                  options={pageOptions}
                  value={selectedPage}
                  onChange={setSelectedPage}
                  placeholder={pagesQuery.isLoading ? "Cargando páginas…" : "Selecciona una página"}
                  disabled={pagesQuery.isLoading}
                />
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!pageChanged}
                loading={selectPage.isPending}
                onClick={() => selectPage.mutate()}
              >
                {connectedMeta.pageId ? "Actualizar" : "Guardar"}
              </Button>
            </div>
            {pagesQuery.isError && <QueryError error={pagesQuery.error} />}
          </div>

          <div>
            <Label>Cuenta publicitaria</Label>
            <p className="mb-2 text-theme-xs text-gray-500 dark:text-gray-400">
              {connectedMeta.adAccountNombre
                ? `Actual: ${connectedMeta.adAccountNombre}.`
                : "Selecciona la cuenta publicitaria asociada a tus campañas."}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Select
                  options={accountOptions}
                  value={selectedAccount}
                  onChange={setSelectedAccount}
                  placeholder={accountsQuery.isLoading ? "Cargando cuentas…" : "Selecciona una cuenta"}
                  disabled={accountsQuery.isLoading}
                />
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!accountChanged}
                loading={selectAccount.isPending}
                onClick={() => selectAccount.mutate()}
              >
                {connectedMeta.adAccountId ? "Actualizar" : "Guardar"}
              </Button>
            </div>
            {accountsQuery.isError && <QueryError error={accountsQuery.error} />}
          </div>

          <ActionButton
            action={disconnectMetaAction}
            successMessage="Meta desconectado"
            invalidateKeys={[queryKeys.metaConnection]}
          >
            Desconectar Meta
          </ActionButton>
        </div>
      )}
    </div>
  );
}

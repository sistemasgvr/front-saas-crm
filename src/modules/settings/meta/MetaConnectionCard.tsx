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
  const needsPage = connection?.conectado && !connection.pageId;
  const needsAccount = connection?.conectado && !connection.adAccountId;

  const [selectedPage, setSelectedPage] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");

  const pagesQuery = useQuery({
    queryKey: queryKeys.metaPages,
    queryFn: () => getMetaPages(),
    enabled: !!needsPage,
  });
  const accountsQuery = useQuery({
    queryKey: queryKeys.metaAdAccounts,
    queryFn: () => getMetaAdAccounts(),
    enabled: !!needsAccount,
  });

  const selectPage = useAppMutation({
    mutationFn: () => {
      const pagina = pagesQuery.data?.find((p) => p.id === selectedPage);
      if (!pagina) throw new Error("Selecciona una página");
      return selectMetaPageAction(pagina.id, pagina.nombre);
    },
    successMessage: "Página guardada",
    invalidateKeys: [queryKeys.metaConnection],
  });

  const selectAccount = useAppMutation({
    mutationFn: () => {
      const cuenta = accountsQuery.data?.find((a) => a.id === selectedAccount);
      if (!cuenta) throw new Error("Selecciona una cuenta publicitaria");
      return selectMetaAdAccountAction(cuenta.id, cuenta.nombre);
    },
    successMessage: "Cuenta publicitaria guardada",
    invalidateKeys: [queryKeys.metaConnection],
  });

  if (connectionQuery.isLoading) return <PageLoader label="Cargando conexión Meta…" />;
  if (connectionQuery.isError) return <QueryError error={connectionQuery.error} />;
  if (!connection) return null;

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

      {connection.appConfigurada && connection.conectado && (
        <div className="space-y-5">
          <p className="text-theme-sm text-gray-700 dark:text-gray-300">
            Conectado como <span className="font-medium">{connection.metaUserNombre}</span>
          </p>

          {needsPage ? (
            <div>
              <Label>Página de Facebook</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Select
                    options={(pagesQuery.data ?? []).map((p) => ({ value: p.id, label: p.nombre }))}
                    value={selectedPage}
                    onChange={setSelectedPage}
                    placeholder={pagesQuery.isLoading ? "Cargando páginas…" : "Selecciona una página"}
                    disabled={pagesQuery.isLoading}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedPage}
                  loading={selectPage.isPending}
                  onClick={() => selectPage.mutate()}
                >
                  Guardar
                </Button>
              </div>
              {pagesQuery.isError && <QueryError error={pagesQuery.error} />}
            </div>
          ) : (
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              Página: <span className="text-gray-800 dark:text-white/90">{connection.pageNombre}</span>
            </p>
          )}

          {needsAccount ? (
            <div>
              <Label>Cuenta publicitaria</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Select
                    options={(accountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
                    value={selectedAccount}
                    onChange={setSelectedAccount}
                    placeholder={accountsQuery.isLoading ? "Cargando cuentas…" : "Selecciona una cuenta"}
                    disabled={accountsQuery.isLoading}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedAccount}
                  loading={selectAccount.isPending}
                  onClick={() => selectAccount.mutate()}
                >
                  Guardar
                </Button>
              </div>
              {accountsQuery.isError && <QueryError error={accountsQuery.error} />}
            </div>
          ) : (
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              Cuenta publicitaria:{" "}
              <span className="text-gray-800 dark:text-white/90">{connection.adAccountNombre}</span>
            </p>
          )}

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

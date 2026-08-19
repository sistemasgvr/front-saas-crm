"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import { Icon } from "@/src/components/ui/Icon";
import ActionButton from "@/src/components/ui/ActionButton";
import Button from "@/src/components/ui/button/Button";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { getMetaPageProfile } from "./queries";
import { resyncMetaPageWebhookAction, unlinkMetaPageAction } from "./actions";
import MetaStatCard from "./MetaStatCard";
import MetaWebhookBadge from "./MetaWebhookBadge";
import { formatearFechaMeta } from "./format";

export default function MetaPageProfileView({ id }: { id: string }) {
  const router = useRouter();

  const { data: pagina, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.metaPageProfile(id),
    queryFn: () => getMetaPageProfile(id),
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <QueryError error={error} />;
  if (!pagina) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pagina.nombre}
        description={pagina.pageId}
        backHref="/settings/meta/pages"
        backLabel="Volver a páginas"
      >
        <MetaWebhookBadge suscrito={pagina.webhookSuscrito} size="md" />
      </PageHeader>

      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <EntityCell
          name={pagina.nombre}
          subtitle={pagina.categoria ?? pagina.pageId}
          src={pagina.fotoUrl}
          icon="mdi:facebook"
          size="lg"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetaStatCard label="Leads totales" value={pagina.totalLeads} icon="mdi:account-group-outline" />
        <MetaStatCard label="Leads últimos 7 días" value={pagina.leadsUltimos7Dias} icon="mdi:calendar-week" />
        <MetaStatCard
          label="Vinculada desde"
          value={formatearFechaMeta(pagina.fechaCreacion)}
          icon="mdi:calendar-check-outline"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <Icon name="mdi:webhook" size={20} className="text-gray-600 dark:text-gray-300" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Estado del webhook</h2>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {pagina.webhookSuscrito
                ? `Suscrita al webhook de leads desde ${formatearFechaMeta(pagina.webhookSuscritoEn)}.`
                : "No está recibiendo leads en vivo — reintenta la suscripción al webhook."}
            </p>
          </div>
        </div>
        <ActionButton
          action={() => resyncMetaPageWebhookAction(pagina.id)}
          successMessage="Webhook re-suscrito"
          loadingText="Re-suscribiendo…"
          invalidateKeys={[queryKeys.metaPageProfile(id), queryKeys.metaPagesVinculadasAll]}
          startIcon={<Icon name="mdi:refresh" size={18} />}
        >
          Re-suscribir webhook
        </ActionButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <Link href={`/leads?metaPaginaId=${pagina.id}`}>
          <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:account-multiple-outline" size={18} />}>
            Ver leads de esta página
          </Button>
        </Link>
        <ActionButton
          action={async () => {
            await unlinkMetaPageAction(pagina.id);
            router.push("/settings/meta/pages");
          }}
          successMessage="Página desvinculada"
          variant="outline"
          startIcon={<Icon name="mdi:link-off" size={18} />}
          invalidateKeys={[queryKeys.metaPagesVinculadasAll, queryKeys.metaPagesAvailable, queryKeys.metaConnection]}
        >
          Desvincular página
        </ActionButton>
      </div>
    </div>
  );
}

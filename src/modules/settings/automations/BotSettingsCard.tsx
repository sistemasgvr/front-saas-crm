"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icon } from "@/src/components/ui/Icon";
import Button from "@/src/components/ui/button/Button";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import { queryKeys } from "@/src/lib/query/keys";
import { resolverControl } from "@/src/modules/chats/control-types";
import { getBotPreferencias, guardarBotPreferencias } from "./bot-actions";

export default function BotSettingsCard() {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.whatsappBotPreferencias,
    queryFn: async () => resolverControl(await getBotPreferencias()),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async (modo: "HUMANO" | "BOT") => {
      if (!query.data) throw new Error("Consulta primero la configuración");
      await cache.cancelQueries({
        queryKey: queryKeys.whatsappBotPreferencias,
      });
      return resolverControl(
        await guardarBotPreferencias(modo, query.data.preferenciasVersion),
      );
    },
    onSuccess: (data) => {
      cache.setQueryData(queryKeys.whatsappBotPreferencias, data);
      toast.success("Preferencia de atención guardada");
    },
    onError: () => {
      void cache.invalidateQueries({
        queryKey: queryKeys.whatsappBotPreferencias,
      });
    },
    meta: { silent: true },
  });
  const c = query.data;
  if (!c?.clientesHabilitados) return null;
  return (
    <CollapsibleSection
      title="Automatizaciones · Bot de WhatsApp"
      icon="mdi:robot-outline"
      help="Define quién inicia la atención de las conversaciones nuevas."
      preview={
        c?.modoInicial === "BOT"
          ? "Bot por defecto"
          : "Equipo humano por defecto"
      }
      defaultOpen={false}
    >
      {query.isLoading ? (
        <p role="status">Consultando atención…</p>
      ) : query.isError ? (
        <div role="alert">
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : c ? (
        <div className="space-y-3 text-gray-700 dark:text-gray-200" aria-busy={mutation.isPending}>
          <p className="text-xs text-gray-500 dark:text-gray-400">Atención de nuevos chats.</p>
          {!c.autorizado && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Bot no habilitado para tu empresa.
            </p>
          )}
          <div
            className="grid gap-3 sm:grid-cols-2"
            role="group"
            aria-label="Atención por defecto"
          >
            {(
              [
                {
                  modo: "HUMANO",
                  icon: "mdi:account-outline",
                  titulo: "Equipo humano",
                  descripcion: "Atiende tu equipo.",
                },
                {
                  modo: "BOT",
                  icon: "mdi:robot-outline",
                  titulo: "Bot",
                  descripcion: "Inicia el bot; el asesor puede intervenir.",
                },
              ] as const
            ).map((o) => (
              <button
                key={o.modo}
                type="button"
                aria-pressed={c.modoInicial === o.modo}
                disabled={
                  mutation.isPending || (o.modo === "BOT" && !c.autorizado)
                }
                onClick={() => mutation.mutate(o.modo)}
                className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${c.modoInicial === o.modo ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-white/5"}`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon name={o.icon} size={20} />
                  {o.titulo}
                  <span className="ml-auto flex h-5 w-5 items-center justify-center">
                    {c.modoInicial === o.modo && <Icon name="mdi:check-circle" size={16} />}
                  </span>
                </span>
                <span className="mt-2 block text-xs text-gray-500 dark:text-gray-400">
                  {o.descripcion}
                </span>
              </button>
            ))}
          </div>
          {c.modoInicial === "BOT" && !c.integracion.operativa && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Bot pendiente de activación; atiende el equipo humano.
            </p>
          )}
        </div>
      ) : null}
    </CollapsibleSection>
  );
}

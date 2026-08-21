"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import EmptyState from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { getChats } from "./queries";

const INTERVALO_REFRESCO_MS = 15_000;

function formatearFecha(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function ChatsView() {
  const chatsQuery = useQuery({
    queryKey: queryKeys.whatsappChats,
    queryFn: getChats,
    refetchInterval: INTERVALO_REFRESCO_MS,
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Chats" description="Conversaciones de WhatsApp vinculadas a tus leads." />

      {chatsQuery.isLoading ? (
        <PageLoader />
      ) : chatsQuery.isError ? (
        <QueryError error={chatsQuery.error} />
      ) : chatsQuery.data?.length === 0 ? (
        <EmptyState
          icon="mdi:whatsapp"
          title="Sin conversaciones todavía"
          description="Cuando un lead te escriba por WhatsApp, o cuando inicies un chat desde su ficha, aparecerá acá."
        />
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-white/[0.03]">
          {(chatsQuery.data ?? []).map((chat) => {
            const nombre = chat.lead?.nombre ?? chat.nombreContacto ?? chat.waId;
            return (
              <Link
                key={chat.id}
                href={`/chats/${chat.id}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              >
                <Avatar name={nombre} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-gray-800 dark:text-white/90">{nombre}</p>
                    <span className="shrink-0 text-theme-xs text-gray-400">
                      {formatearFecha(chat.ultimoMensajeEn)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-theme-sm text-gray-500 dark:text-gray-400">
                      {chat.ultimoMensajeTexto ?? "Sin mensajes de texto"}
                    </p>
                    {chat.noLeidos > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-theme-xs font-medium text-white">
                        {chat.noLeidos}
                      </span>
                    )}
                  </div>
                  {!chat.lead && (
                    <span className="mt-1 inline-flex items-center gap-1 text-theme-xs text-warning-500">
                      <Icon name="mdi:account-question-outline" size={14} />
                      Sin lead vinculado
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

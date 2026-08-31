"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import EmptyState from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/ui/Icon";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { getChats } from "./queries";

const INTERVALO_REFRESCO_MS = 15_000;

function formatearFecha(iso: string | null) {
  if (!iso) return "";
  const fecha = new Date(iso);
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();
  return fecha.toLocaleString("es-PE", {
    timeZone: "America/Lima",
    ...(esHoy ? { timeStyle: "short" as const } : { dateStyle: "short" as const }),
  });
}

/** Lista de conversaciones tipo WhatsApp Web — vive en el layout de /chats,
 * así se mantiene montada (sin recargar) al navegar entre conversaciones. */
export default function ChatsSidebar() {
  const pathname = usePathname();
  const activeId = pathname.match(/^\/chats\/([^/]+)/)?.[1];
  const chatsQuery = useQuery({
    queryKey: queryKeys.whatsappChats,
    queryFn: getChats,
    refetchInterval: INTERVALO_REFRESCO_MS,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <h1 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Chats</h1>
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">WhatsApp de tus leads</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chatsQuery.isLoading ? (
          <PageLoader />
        ) : chatsQuery.isError ? (
          <div className="p-4">
            <QueryError error={chatsQuery.error} />
          </div>
        ) : chatsQuery.data?.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon="mdi:whatsapp"
              title="Sin conversaciones"
              description="Cuando un lead te escriba, o inicies un chat desde su ficha, aparecerá acá."
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(chatsQuery.data ?? []).map((chat) => {
              const nombre = chat.lead?.nombre ?? chat.nombreContacto ?? chat.waId;
              const activo = chat.id === activeId;
              return (
                <Link
                  key={chat.id}
                  href={`/chats/${chat.id}`}
                  className={`flex items-center gap-3 px-4 py-3 transition ${
                    activo
                      ? "bg-brand-50 dark:bg-brand-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <Avatar name={nombre} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {nombre}
                      </p>
                      <span className="shrink-0 text-theme-xs text-gray-400">
                        {formatearFecha(chat.ultimoMensajeEn)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                        {chat.ultimoMensajeTexto ?? "Sin mensajes de texto"}
                      </p>
                      {chat.noLeidos > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-theme-xs font-medium text-white">
                          {chat.noLeidos}
                        </span>
                      )}
                    </div>
                    {!chat.lead && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-theme-xs text-warning-500">
                        <Icon name="mdi:account-question-outline" size={12} />
                        Sin lead
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

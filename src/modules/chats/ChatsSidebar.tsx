"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import EmptyState from "@/src/components/ui/EmptyState";
import Switch from "@/src/components/form/switch/Switch";
import { Icon } from "@/src/components/ui/Icon";
import { QueryError } from "@/src/components/ui/PageLoader";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { queryKeys } from "@/src/lib/query/keys";
import OrigenLeadBadge from "@/src/modules/leads/OrigenLeadBadge";
import { textoWhatsAppPlano } from "./texto-whatsapp-plano";
import { filtrarConversaciones } from "./filtrar-conversaciones";
import { etiquetaConversacion } from "./etiqueta-conversacion";
import { useChatBorradores } from "./chat-borradores";
import { getChats } from "./queries";

const INTERVALO_REFRESCO_MS = 45_000;

type Rol = "PROPIETARIO" | "ADMINISTRADOR" | "USUARIO" | null;

/** Poll solo con la pestaña visible — evita saturar Prisma con pestañas en background. */
function intervaloSiVisible(ms: number): number | false {
  if (typeof document === "undefined") return ms;
  return document.visibilityState === "visible" ? ms : false;
}

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

function ChatsListSkeleton() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800" role="status" aria-label="Cargando chats">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-3/4 max-w-[180px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lista de conversaciones tipo WhatsApp Web — vive en el layout de /chats,
 * así se mantiene montada (sin recargar) al navegar entre conversaciones. */
export default function ChatsSidebar({ rol: _rol }: { rol: Rol }) {
  const pathname = usePathname();
  const activeId = pathname.match(/^\/chats\/([^/]+)/)?.[1];
  const [soloMios, setSoloMios] = useState(false);
  const asignadoFiltro: "todos" | "mios" = soloMios ? "mios" : "todos";
  const [busqueda, setBusqueda] = useState("");
  const busquedaDeferred = useDeferredValue(busqueda);
  const borradores = useChatBorradores();
  const chatsQuery = useQuery({
    queryKey: queryKeys.whatsappChatsList(asignadoFiltro),
    queryFn: () => getChats(asignadoFiltro),
    refetchInterval: () => intervaloSiVisible(INTERVALO_REFRESCO_MS),
  });

  const chatsFiltrados = useMemo(
    () => filtrarConversaciones(chatsQuery.data ?? [], busquedaDeferred, borradores),
    [chatsQuery.data, busquedaDeferred, borradores],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Chats</h1>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">WhatsApp de tus leads</p>
          </div>
          <Switch
            label={soloMios ? "Solo míos" : "Todos"}
            checked={soloMios}
            onChange={setSoloMios}
          />
        </div>
        <div className="relative mt-3">
          <Icon
            name="mdi:magnify"
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar un chat"
            aria-label="Buscar un chat"
            className="h-9 w-full rounded-lg border-0 bg-gray-100 py-2 pl-9 pr-8 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Limpiar búsqueda"
            >
              <Icon name="mdi:close" size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="thin-scrollbar flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        {chatsQuery.isLoading ? (
          <ChatsListSkeleton />
        ) : chatsQuery.isError ? (
          <QueryError error={chatsQuery.error} onRetry={() => void chatsQuery.refetch()} />
        ) : chatsQuery.data?.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon="mdi:whatsapp"
              title="Sin conversaciones"
              description="Cuando un lead te escriba, o inicies un chat desde su ficha, aparecerá acá."
            />
          </div>
        ) : chatsFiltrados.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon="mdi:magnify"
              title="Sin resultados"
              description={`No hay chats que coincidan con "${busquedaDeferred.trim()}".`}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {chatsFiltrados.map((chat) => {
              const nombre = etiquetaConversacion(chat);
              const activo = chat.id === activeId;
              const asesor = chat.lead?.asignado?.nombre?.trim() || null;
              // Como WhatsApp: el borrador solo se ve en la lista si NO estás en ese chat.
              const borrador = activo ? undefined : borradores[chat.id]?.trim() || undefined;
              return (
                <Link
                  key={chat.id}
                  href={`/chats/${chat.id}`}
                  className={`flex min-h-[64px] items-center gap-3 px-4 py-3.5 transition active:bg-gray-100 dark:active:bg-white/[0.04] ${
                    activo
                      ? "bg-brand-50 dark:bg-brand-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <Avatar name={nombre} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {nombre}
                        </p>
                        {asesor ? (
                          <span
                            className="max-w-[7rem] shrink-0 truncate rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300"
                            title={asesor}
                          >
                            {asesor}
                          </span>
                        ) : chat.lead ? (
                          <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                            Libre
                          </span>
                        ) : null}
                        {chat.lead?.origen ? (
                          <OrigenLeadBadge origen={chat.lead.origen} className="shrink-0" />
                        ) : null}
                      </div>
                      <span className="shrink-0 text-theme-xs text-gray-400">
                        {formatearFecha(chat.ultimoMensajeEn)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {borrador ? (
                        <p className="truncate text-theme-xs text-teal-600 dark:text-teal-400">
                          <span className="font-medium">Borrador:</span> {borrador}
                        </p>
                      ) : (
                        <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                          {chat.ultimoMensajeTexto
                            ? textoWhatsAppPlano(chat.ultimoMensajeTexto)
                            : "Sin mensajes"}
                        </p>
                      )}
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

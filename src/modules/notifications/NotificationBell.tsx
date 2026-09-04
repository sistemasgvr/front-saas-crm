"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DropdownItem } from "@/src/components/ui/dropdown/DropdownItem";
import Avatar from "@/src/components/ui/avatar/Avatar";
import { Icon } from "@/src/components/ui/Icon";
import { ListItemSkeleton } from "@/src/components/ui/skeletons";
import { popoverMotionClass, useOpenTransition } from "@/src/components/ui/use-open-transition";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { useNotificationsSocket } from "./useNotificationsSocket";
import { getNotifications, getUnreadCount } from "./queries";
import { markNotificationReadAction } from "./actions";
import { resolverRutaNotificacion, type NotificacionItem } from "./types";

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" });
}

interface NotificationBellProps {
  organizacionId: string;
}

export default function NotificationBell({ organizacionId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { visible, entered } = useOpenTransition(isOpen);

  useNotificationsSocket(Boolean(organizacionId));

  const unreadQuery = useQuery({
    queryKey: queryKeys.notificationsUnreadCount,
    queryFn: () => getUnreadCount(),
  });
  const listQuery = useQuery({
    queryKey: queryKeys.notifications({ page: 1 }),
    queryFn: () => getNotifications(1),
    enabled: isOpen,
  });

  const marcarLeida = useAppMutation({
    mutationFn: (id: string) => markNotificationReadAction(id),
    invalidateKeys: [queryKeys.notificationsAll, queryKeys.notificationsUnreadCount],
  });

  const unreadCount = unreadQuery.data?.count ?? 0;
  const items = (listQuery.data?.data ?? []).slice(0, 10);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const gutter = 12;
    const maxWidth = Math.min(352, window.innerWidth - gutter * 2);
    const left = Math.min(Math.max(gutter, rect.right - maxWidth), window.innerWidth - maxWidth - gutter);
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left,
      width: maxWidth,
      maxHeight: "min(70vh, 28rem)",
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function abrirNotificacion(item: NotificacionItem) {
    setIsOpen(false);
    if (!item.leida) marcarLeida.mutate(item.id);
    const ruta = resolverRutaNotificacion(item.payload);
    if (ruta) router.push(ruta);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Notificaciones"
      >
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <Icon name="mdi:bell-outline" size={20} />
      </button>

      {visible && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              style={panelStyle}
              className={`z-99999 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${popoverMotionClass(entered)}`}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <h5 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Notificaciones</h5>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
                  aria-label="Cerrar"
                >
                  <Icon name="mdi:close" size={18} />
                </button>
              </div>

              <ul className="max-h-[360px] overflow-y-auto">
                {listQuery.isLoading && (
                  <li>
                    <ListItemSkeleton count={4} />
                  </li>
                )}
                {!listQuery.isLoading && items.length === 0 && (
                  <li className="px-4 py-8 text-center text-theme-sm text-gray-500">Sin notificaciones.</li>
                )}
                {items.map((item) => (
                  <li key={item.id}>
                    <DropdownItem
                      onItemClick={() => abrirNotificacion(item)}
                      className="flex items-start gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800"
                    >
                      <Avatar name={item.titulo} icon="mdi:account-plus-outline" size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-theme-sm text-gray-800 dark:text-white/90">
                          {item.titulo}
                          {!item.leida && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand-500" />}
                        </span>
                        <span className="mt-0.5 block truncate text-theme-xs text-gray-500 dark:text-gray-400">
                          {item.mensaje}
                        </span>
                        <span className="mt-0.5 block text-theme-xs text-gray-400">
                          {formatearFecha(item.fechaCreacion)}
                        </span>
                      </span>
                    </DropdownItem>
                  </li>
                ))}
              </ul>

              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block border-t border-gray-100 px-4 py-3 text-center text-theme-sm font-medium text-brand-500 hover:text-brand-600 dark:border-gray-800"
              >
                Ver todas
              </Link>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

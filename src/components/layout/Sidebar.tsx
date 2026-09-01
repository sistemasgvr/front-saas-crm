"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AppLogo from "@/src/components/ui/AppLogo";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { getChatsUnreadCount } from "@/src/modules/chats/queries";
import { useSidebar } from "./SidebarContext";

export type NavItem = {
  name: string;
  icon: string;
  path: string;
  requiereModulo?: string;
};

interface SidebarProps {
  items: NavItem[];
  homeHref: string;
  sectionTitle?: string;
}

export default function Sidebar({ items, homeHref, sectionTitle = "Menú" }: SidebarProps) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const expanded = isExpanded || isHovered || isMobileOpen;

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  // Solo se pide si "Chats" está en el menú (módulo WHATSAPP activo) — si no
  // está, el endpoint ni siquiera respondería (ModuleGuard).
  const tieneChats = items.some((item) => item.path === "/chats");
  const chatsUnreadQuery = useQuery({
    queryKey: queryKeys.whatsappChatsUnreadCount,
    queryFn: () => getChatsUnreadCount(),
    enabled: tieneChats,
    refetchInterval: 60_000,
  });
  const chatsNoLeidos = chatsUnreadQuery.data?.count ?? 0;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 h-screen px-5 bg-white text-gray-900 border-r border-gray-200 transition-all duration-300 ease-in-out z-50 dark:border-gray-800 dark:bg-gray-900
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex py-8 ${!expanded ? "lg:justify-center" : "justify-start"}`}>
        {expanded ? (
          <AppLogo href={homeHref} variant="full" width={150} height={40} priority />
        ) : (
          <AppLogo href={homeHref} variant="icon" priority />
        )}
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
                  !expanded ? "lg:justify-center" : "justify-start"
                }`}
              >
                {expanded ? sectionTitle : <Icon name="mdi:dots-horizontal" size={20} />}
              </h2>
              <ul className="flex flex-col gap-4">
                {items.map((item) => {
                  const active = isActive(item.path);
                  const badge = item.path === "/chats" ? chatsNoLeidos : 0;
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"} ${
                          !expanded ? "lg:justify-center" : "lg:justify-start"
                        }`}
                      >
                        <span className={`relative ${active ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                          <Icon name={item.icon} size={22} />
                          {badge > 0 && !expanded && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-medium text-white">
                              {badge > 9 ? "9+" : badge}
                            </span>
                          )}
                        </span>
                        {expanded && <span className="menu-item-text">{item.name}</span>}
                        {badge > 0 && expanded && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1.5 text-[11px] font-medium text-white">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}

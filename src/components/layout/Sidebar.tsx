"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AppLogo from "@/src/components/ui/AppLogo";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { getChatsUnreadCount } from "@/src/modules/chats/queries";
import { getLeadsNuevosCount } from "@/src/modules/leads/queries";
import { useSidebar } from "./SidebarContext";

export type NavItem = {
  name: string;
  icon: string;
  path: string;
  requiereModulo?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

interface SidebarProps {
  /** Lista plana (admin / compat). Si hay `groups`, se ignora. */
  items?: NavItem[];
  /** Secciones por producto (app cliente). */
  groups?: NavGroup[];
  homeHref: string;
  /** Título único cuando solo se pasa `items`. */
  sectionTitle?: string;
}

function NavLink({
  item,
  active,
  expanded,
  badge,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  badge: number;
}) {
  return (
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
  );
}

export default function Sidebar({
  items,
  groups,
  homeHref,
  sectionTitle = "Menú",
}: SidebarProps) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const expanded = isExpanded || isHovered || isMobileOpen;

  const resolvedGroups: NavGroup[] =
    groups && groups.length > 0
      ? groups
      : [{ title: sectionTitle, items: items ?? [] }];

  const allItems = resolvedGroups.flatMap((g) => g.items);

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const tieneChats = allItems.some((item) => item.path === "/chats");
  const chatsUnreadQuery = useQuery({
    queryKey: queryKeys.whatsappChatsUnreadCount,
    queryFn: () => getChatsUnreadCount(),
    enabled: tieneChats,
    refetchInterval: 60_000,
  });
  const chatsNoLeidos = chatsUnreadQuery.data?.count ?? 0;

  const tieneLeads = allItems.some((item) => item.path === "/leads");
  const leadsNuevosQuery = useQuery({
    queryKey: queryKeys.leadsNuevosCount,
    queryFn: () => getLeadsNuevosCount(),
    enabled: tieneLeads,
    refetchInterval: 60_000,
  });
  const leadsNuevos = leadsNuevosQuery.data?.count ?? 0;

  const badgeFor = (path: string) =>
    path === "/chats" ? chatsNoLeidos : path === "/leads" ? leadsNuevos : 0;

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
          <div className="flex flex-col gap-6">
            {resolvedGroups.map((group) => (
              <div key={group.title}>
                <h2
                  className={`mb-3 flex text-xs uppercase leading-[20px] tracking-wide text-gray-400 ${
                    !expanded ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {expanded ? group.title : <Icon name="mdi:dots-horizontal" size={20} />}
                </h2>
                <ul className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        item={item}
                        active={isActive(item.path)}
                        expanded={expanded}
                        badge={badgeFor(item.path)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
}

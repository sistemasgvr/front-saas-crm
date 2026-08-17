"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/src/components/ui/Icon";
import { useSidebar } from "./SidebarContext";

type NavItem = {
  name: string;
  icon: string;
  path: string;
  requiereModulo?: string;
};

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/dashboard", requiereModulo: "DASHBOARD" },
  { name: "Leads", icon: "mdi:account-multiple-outline", path: "/leads", requiereModulo: "META_LEADS" },
  { name: "Configuración", icon: "mdi:cog-outline", path: "/settings" },
];

interface SidebarProps {
  modulosHabilitados: Set<string>;
}

export default function Sidebar({ modulosHabilitados }: SidebarProps) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const expanded = isExpanded || isHovered || isMobileOpen;

  const items = NAV_ITEMS.filter(
    (item) => !item.requiereModulo || modulosHabilitados.has(item.requiereModulo),
  );

  const isActive = (path: string) => pathname === path;

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
        <Link href="/dashboard">
          {expanded ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="GVR CRM"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="GVR CRM"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image src="/images/logo/logo-icon.svg" alt="GVR CRM" width={32} height={32} />
          )}
        </Link>
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
                {expanded ? "Menú" : <Icon name="mdi:dots-horizontal" size={20} />}
              </h2>
              <ul className="flex flex-col gap-4">
                {items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"} ${
                          !expanded ? "lg:justify-center" : "lg:justify-start"
                        }`}
                      >
                        <span className={active ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                          <Icon name={item.icon} size={22} />
                        </span>
                        {expanded && <span className="menu-item-text">{item.name}</span>}
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

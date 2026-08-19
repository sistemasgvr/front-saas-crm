"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/src/components/ui/Icon";

const TABS = [
  { href: "/settings/meta", label: "Conexión", icon: "mdi:link-variant", exact: true },
  { href: "/settings/meta/pages", label: "Páginas", icon: "mdi:facebook", exact: false },
  { href: "/settings/meta/ad-accounts", label: "Cuentas publicitarias", icon: "mdi:bullhorn-outline", exact: false },
];

export default function MetaHubTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800" aria-label="Secciones Meta">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-theme-sm font-medium transition-colors ${
              active
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <Icon name={tab.icon} size={18} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

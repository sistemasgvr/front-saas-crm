"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import NotificationPermissionGate from "@/src/modules/notifications/NotificationPermissionGate";

export default function AppShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const esChats = pathname === "/chats" || pathname.startsWith("/chats/");

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div
      className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin} ${
        esChats
          ? // Móvil: panel fijo al viewport visible (svh). Evita el corte del header
            // que provoca h-dvh + overflow en Safari/Chrome iOS.
            "fixed inset-0 z-30 flex flex-col overflow-hidden overscroll-none bg-gray-50 dark:bg-gray-900 md:static md:inset-auto md:z-auto md:h-auto md:max-h-none md:overflow-visible md:overscroll-auto md:bg-transparent"
          : ""
      }`}
    >
      <NotificationPermissionGate />
      <div className={esChats ? "shrink-0" : undefined}>{header}</div>
      <div
        className={
          esChats
            ? "mx-auto flex min-h-0 w-full max-w-(--breakpoint-2xl) flex-1 flex-col overflow-hidden p-0 md:p-6"
            : "mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6"
        }
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import NotificationPermissionGate from "@/src/modules/notifications/NotificationPermissionGate";

export default function AppShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  // Chats: ocupar exactamente el alto bajo el header (sin padding ni calc dvh
  // que en iOS Safari solapa el sticky header).
  const esChats = pathname === "/chats" || pathname.startsWith("/chats/");

  useEffect(() => {
    if (!esChats) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [esChats]);

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div
      className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin} ${
        esChats ? "flex h-dvh max-h-dvh flex-col overflow-hidden" : ""
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

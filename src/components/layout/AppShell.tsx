"use client";

import { ReactNode } from "react";
import { useSidebar } from "./SidebarContext";

export default function AppShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
      {header}
      <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">{children}</div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Panel partido tipo WhatsApp Web: lista a la izquierda + conversación.
 * En móvil el alto lo marca AppShell; overflow-x bloqueado para evitar
 * scroll horizontal por burbujas/acciones.
 */
export default function ChatsShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const hayConversacionAbierta = pathname !== "/chats";

  return (
    <div className="flex h-full min-h-0 max-w-full overflow-hidden border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] md:h-[calc(100vh-180px)] md:min-h-[520px] md:rounded-2xl md:border">
      <div
        className={`h-full w-full shrink-0 overflow-hidden border-r border-gray-100 dark:border-gray-800 md:block md:w-[340px] ${
          hayConversacionAbierta ? "hidden" : "block"
        }`}
      >
        {sidebar}
      </div>
      <div
        className={`min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-x-hidden md:flex ${
          hayConversacionAbierta ? "flex" : "hidden"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

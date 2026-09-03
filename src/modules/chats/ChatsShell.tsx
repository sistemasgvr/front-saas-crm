"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Panel partido tipo WhatsApp Web: lista a la izquierda (fija) + conversación
 * a la derecha. En móvil ocupa el viewport (menos el header) para scroll y
 * composer usables con el tacto.
 */
export default function ChatsShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const hayConversacionAbierta = pathname !== "/chats";

  return (
    <div
      className="-mx-4 flex h-[calc(100dvh-7.5rem)] min-h-0 overflow-hidden border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] md:mx-0 md:h-[calc(100vh-180px)] md:min-h-[520px] md:rounded-2xl md:border"
    >
      <div
        className={`h-full w-full shrink-0 overflow-hidden border-r border-gray-100 dark:border-gray-800 md:block md:w-[340px] ${
          hayConversacionAbierta ? "hidden" : "block"
        }`}
      >
        {sidebar}
      </div>
      <div
        className={`min-h-0 min-w-0 flex-1 flex-col md:flex ${hayConversacionAbierta ? "flex" : "hidden"}`}
      >
        {children}
      </div>
    </div>
  );
}

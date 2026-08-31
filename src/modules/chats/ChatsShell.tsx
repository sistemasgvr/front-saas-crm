"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Panel partido tipo WhatsApp Web: lista a la izquierda (fija, no se
 * recarga al cambiar de conversación) + conversación a la derecha.
 * En mobile se muestra solo uno de los dos, según la ruta activa.
 */
export default function ChatsShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const hayConversacionAbierta = pathname !== "/chats";

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div
        className={`w-full shrink-0 border-r border-gray-100 dark:border-gray-800 md:block md:w-[340px] ${
          hayConversacionAbierta ? "hidden" : "block"
        }`}
      >
        {sidebar}
      </div>
      <div className={`min-w-0 flex-1 md:block ${hayConversacionAbierta ? "block" : "hidden"}`}>{children}</div>
    </div>
  );
}

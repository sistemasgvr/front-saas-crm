"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { getWhatsappConexiones } from "./queries";

export default function WhatsappSettingsEntryCard() {
  const conexionesQuery = useQuery({
    queryKey: queryKeys.whatsappConexiones,
    queryFn: getWhatsappConexiones,
  });

  const vinculado = (conexionesQuery.data?.length ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
            <Icon name="mdi:whatsapp" size={24} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">WhatsApp</h2>
              <Badge color={vinculado ? "success" : "light"} size="sm">
                {vinculado ? "Número vinculado" : "Sin vincular"}
              </Badge>
            </div>
            <p className="mt-1 max-w-xl text-theme-sm text-gray-500 dark:text-gray-400">
              {vinculado
                ? "Chatea con tus leads desde el CRM."
                : "Vincula tu número de WhatsApp Business para chatear con tus leads."}
            </p>
          </div>
        </div>
        <Link href="/settings/whatsapp" className="shrink-0">
          <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:cog-outline" size={18} />}>
            Gestionar WhatsApp
          </Button>
        </Link>
      </div>
    </div>
  );
}

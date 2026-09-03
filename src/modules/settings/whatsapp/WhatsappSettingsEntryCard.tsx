"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { getWhatsappConexiones } from "./queries";

export default function WhatsappSettingsEntryCard() {
  const conexionesQuery = useQuery({
    queryKey: queryKeys.whatsappConexiones,
    queryFn: getWhatsappConexiones,
  });

  const vinculado = (conexionesQuery.data?.length ?? 0) > 0;
  const estado = vinculado ? "Número vinculado" : "Sin vincular";

  return (
    <CollapsibleSection
      title="WhatsApp"
      icon="mdi:whatsapp"
      help="Vincula WhatsApp Business para chatear con tus leads desde el CRM."
      preview={vinculado ? "Chatea con tus leads desde el CRM." : "Sin número vinculado."}
      badge={estado}
      badgeColor={vinculado ? "success" : "light"}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Badge color={vinculado ? "success" : "light"} size="sm">
          {estado}
        </Badge>
        <Link href="/settings/whatsapp" className="shrink-0">
          <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:cog-outline" size={18} />}>
            Gestionar WhatsApp
          </Button>
        </Link>
      </div>
    </CollapsibleSection>
  );
}

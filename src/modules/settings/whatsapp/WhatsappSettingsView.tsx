"use client";

import { useQuery } from "@tanstack/react-query";
import EmptyState from "@/src/components/ui/EmptyState";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import MetaLinkResourcePanel from "../meta/MetaLinkResourcePanel";
import WhatsappTemplatesPanel from "./WhatsappTemplatesPanel";
import { linkWhatsappNumeroAction } from "./actions";
import WhatsappConnectionCard from "./WhatsappConnectionCard";
import { getWhatsappConexiones, getWhatsappNumerosDisponibles } from "./queries";

const INVALIDATE = [queryKeys.whatsappConexiones, queryKeys.whatsappNumerosDisponibles];

export default function WhatsappSettingsView() {

  const conexionesQuery = useQuery({
    queryKey: queryKeys.whatsappConexiones,
    queryFn: getWhatsappConexiones,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Vincula el número de WhatsApp Business de la organización para chatear con tus leads."
        backHref="/settings"
        backLabel="Volver a Configuración"
      />

      <MetaLinkResourcePanel
        title="Vincular número de WhatsApp"
        icon="mdi:whatsapp"
        loadingLabel="Buscando números disponibles…"
        emptyMessage="No hay números nuevos por vincular — verifica que el WABA esté conectado a tu Meta App"
        queryKey={queryKeys.whatsappNumerosDisponibles}
        queryFn={async () => {
          const numeros = await getWhatsappNumerosDisponibles();
          return numeros.map((n) => ({
            id: n.phoneNumberId,
            nombre: `${n.displayPhoneNumber} — ${n.verifiedName}`,
          }));
        }}
        onLink={async (item) => {
          const numeros = await getWhatsappNumerosDisponibles();
          const numero = numeros.find((n) => n.phoneNumberId === item.id);
          if (!numero) return;
          await linkWhatsappNumeroAction(
            numero.wabaId,
            numero.phoneNumberId,
            numero.displayPhoneNumber,
            numero.verifiedName,
          );
        }}
        successMessage="Número de WhatsApp vinculado"
        invalidateKeys={INVALIDATE}
      />

      {conexionesQuery.isLoading ? (
        <PageLoader />
      ) : conexionesQuery.isError ? (
        <QueryError error={conexionesQuery.error} />
      ) : conexionesQuery.data && conexionesQuery.data.length === 0 ? (
        <EmptyState
          icon="mdi:whatsapp"
          title="Sin número vinculado"
          description="Vincula un número arriba para empezar a chatear con tus leads."
        />
      ) : (
        <div className="space-y-3">
          {(conexionesQuery.data ?? []).map((conexion) => (
            <WhatsappConnectionCard key={conexion.id} conexion={conexion} />
          ))}
        </div>
      )}

      <WhatsappTemplatesPanel />
    </div>
  );
}

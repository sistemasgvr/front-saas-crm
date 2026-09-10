import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import AgendaView from "@/src/modules/agenda/AgendaView";
import { CalendarSkeleton } from "@/src/components/ui/skeletons";

export default async function AgendaPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "META_LEADS")) {
    redirect(getDefaultClientRoute(me));
  }

  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <AgendaView
        rol={me.rol}
        usuarioId={me.usuario.id}
        crmHabilitado={isModuloHabilitado(me.modulos, "CRM")}
      />
    </Suspense>
  );
}

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import AgendaView from "@/src/modules/agenda/AgendaView";
import { CalendarSkeleton } from "@/src/components/ui/skeletons";
import { tienePermiso } from "@/src/lib/permisos";

export default async function AgendaPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "LEADS") ||
    !tienePermiso(me.permisos, "leads.ver")
  ) {
    redirect(getDefaultClientRoute(me));
  }

  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <AgendaView
        usuarioId={me.usuario.id}
        inmueblesHabilitado={isModuloHabilitado(me.modulos, "INMUEBLES")}
      />
    </Suspense>
  );
}

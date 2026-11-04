import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import LeadsKanbanView from "@/src/modules/leads/LeadsKanbanView";
import { tienePermiso } from "@/src/lib/permisos";

export default async function LeadsTableroPage() {
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
    <LeadsKanbanView
      usuarioId={me.usuario.id}
      whatsappHabilitado={isModuloHabilitado(me.modulos, "WHATSAPP")}
      inmueblesHabilitado={isModuloHabilitado(me.modulos, "INMUEBLES")}
    />
  );
}

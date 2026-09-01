import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import LeadsKanbanView from "@/src/modules/leads/LeadsKanbanView";

export default async function LeadsTableroPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "META_LEADS")) {
    redirect(getDefaultClientRoute(me));
  }

  return <LeadsKanbanView rol={me.rol} usuarioId={me.usuario.id} />;
}

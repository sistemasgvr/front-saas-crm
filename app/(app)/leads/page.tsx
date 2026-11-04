import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import LeadsView from "@/src/modules/leads/LeadsView";
import { tienePermiso } from "@/src/lib/permisos";

export default async function LeadsPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "LEADS") ||
    !tienePermiso(me.permisos, "leads.ver")
  ) {
    redirect(getDefaultClientRoute(me));
  }

  return <LeadsView usuarioId={me.usuario.id} />;
}

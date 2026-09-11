import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import { canViewOrgDashboard } from "@/src/lib/roles";
import DashboardView from "@/src/modules/dashboard/DashboardView";

export default async function DashboardPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "DASHBOARD") || !canViewOrgDashboard(me.rol)) {
    redirect(getDefaultClientRoute(me));
  }

  return <DashboardView rol={me.rol} usuarioId={me.usuario.id} crmHabilitado={isModuloHabilitado(me.modulos, "CRM")} />;
}

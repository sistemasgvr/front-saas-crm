import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import DashboardView from "@/src/modules/dashboard/DashboardView";

export default async function DashboardPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "DASHBOARD")) {
    redirect(getDefaultClientRoute(me));
  }

  return <DashboardView />;
}

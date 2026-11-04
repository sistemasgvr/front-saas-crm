import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import { tienePermiso } from "@/src/lib/permisos";
import DashboardView from "@/src/modules/dashboard/DashboardView";

export default async function DashboardPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (
    !isModuloHabilitado(me.modulos, "DASHBOARD") ||
    !tienePermiso(me.permisos, "dashboard.ver")
  ) {
    redirect(getDefaultClientRoute(me));
  }

  return (
    <DashboardView
      usuarioId={me.usuario.id}
      inmueblesHabilitado={isModuloHabilitado(me.modulos, "INMUEBLES")}
    />
  );
}

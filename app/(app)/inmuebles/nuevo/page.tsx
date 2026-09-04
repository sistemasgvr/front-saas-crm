import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import { canManageOrganization } from "@/src/lib/roles";
import NuevoInmuebleView from "@/src/modules/inmuebles/NuevoInmuebleView";

export default async function NuevoInmueblePage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "CRM")) {
    redirect(getDefaultClientRoute(me));
  }
  if (!canManageOrganization(me.rol)) {
    redirect("/inmuebles");
  }

  return <NuevoInmuebleView />;
}

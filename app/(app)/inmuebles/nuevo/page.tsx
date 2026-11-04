import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import NuevoInmuebleView from "@/src/modules/inmuebles/NuevoInmuebleView";
import { tienePermiso } from "@/src/lib/permisos";

export default async function NuevoInmueblePage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "INMUEBLES") ||
    !tienePermiso(me.permisos, "inmuebles.ver")
  ) {
    redirect(getDefaultClientRoute(me));
  }
  if (!tienePermiso(me.permisos, "inmuebles.crear")) {
    redirect("/inmuebles");
  }

  return <NuevoInmuebleView />;
}

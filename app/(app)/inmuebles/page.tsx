import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import InmueblesView from "@/src/modules/inmuebles/InmueblesView";
import { tienePermiso } from "@/src/lib/permisos";

export default async function InmueblesPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "INMUEBLES") ||
    !tienePermiso(me.permisos, "inmuebles.ver")
  ) {
    redirect(getDefaultClientRoute(me));
  }

  return <InmueblesView />;
}

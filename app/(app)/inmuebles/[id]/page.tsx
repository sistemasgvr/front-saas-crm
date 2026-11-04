import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import InmuebleDetailView from "@/src/modules/inmuebles/InmuebleDetailView";
import { tienePermiso } from "@/src/lib/permisos";

export default async function InmuebleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "INMUEBLES") ||
    !tienePermiso(me.permisos, "inmuebles.ver")
  ) {
    redirect(getDefaultClientRoute(me));
  }

  return <InmuebleDetailView id={id} />;
}

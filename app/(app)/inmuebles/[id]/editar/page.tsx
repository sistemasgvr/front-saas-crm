import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import { canManageOrganization } from "@/src/lib/roles";
import InmuebleDetailView from "@/src/modules/inmuebles/InmuebleDetailView";

export default async function EditarInmueblePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "META_LEADS")) {
    redirect(getDefaultClientRoute(me));
  }
  if (!canManageOrganization(me.rol)) {
    redirect(`/inmuebles/${id}`);
  }

  return <InmuebleDetailView id={id} rol={me.rol} editMode />;
}

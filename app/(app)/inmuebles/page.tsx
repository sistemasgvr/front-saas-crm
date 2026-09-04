import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import InmueblesView from "@/src/modules/inmuebles/InmueblesView";

export default async function InmueblesPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "META_LEADS")) {
    redirect(getDefaultClientRoute(me));
  }

  return <InmueblesView rol={me.rol} />;
}

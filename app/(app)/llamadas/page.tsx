import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import LlamadasListView from "@/src/modules/calls/LlamadasListView";
import { tienePermiso } from "@/src/lib/permisos";

export default async function LlamadasPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "WHATSAPP") ||
    !tienePermiso(me.permisos, "llamadas.usar")
  ) {
    redirect(getDefaultClientRoute(me));
  }

  return <LlamadasListView />;
}

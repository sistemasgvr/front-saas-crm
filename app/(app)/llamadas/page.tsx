import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import LlamadasListView from "@/src/modules/calls/LlamadasListView";

export default async function LlamadasPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "WHATSAPP")) {
    redirect(getDefaultClientRoute(me));
  }

  return <LlamadasListView />;
}

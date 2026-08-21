import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import ChatsView from "@/src/modules/chats/ChatsView";

export default async function ChatsPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "WHATSAPP")) {
    redirect(getDefaultClientRoute(me));
  }

  return <ChatsView />;
}

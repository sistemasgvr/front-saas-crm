import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import ChatsShell from "@/src/modules/chats/ChatsShell";
import ChatsSidebar from "@/src/modules/chats/ChatsSidebar";

export default async function ChatsLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "WHATSAPP")) {
    redirect(getDefaultClientRoute(me));
  }

  return (
    <ChatsShell sidebar={<ChatsSidebar />}>
      {children}
    </ChatsShell>
  );
}

import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute, isModuloHabilitado } from "@/src/lib/modules";
import ChatDetailView from "@/src/modules/chats/ChatDetailView";

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "WHATSAPP")) {
    redirect(getDefaultClientRoute(me));
  }

  return <ChatDetailView id={id} />;
}

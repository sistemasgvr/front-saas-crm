import ChatDetailView from "@/src/modules/chats/ChatDetailView";

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // key={id}: remonta el composer al cambiar de chat — evita que el texto
  // del chat anterior quede pegado como "borrador fantasma".
  return <ChatDetailView key={id} id={id} />;
}

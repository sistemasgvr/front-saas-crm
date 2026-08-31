import ChatDetailView from "@/src/modules/chats/ChatDetailView";

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatDetailView id={id} />;
}

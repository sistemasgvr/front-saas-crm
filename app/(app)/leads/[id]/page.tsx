import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import LeadDetailView from "@/src/modules/leads/LeadDetailView";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  return <LeadDetailView id={id} rol={me.rol} usuarioId={me.usuario.id} />;
}

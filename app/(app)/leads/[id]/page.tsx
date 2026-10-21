import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { isModuloHabilitado } from "@/src/lib/modules";
import LeadDetailView from "@/src/modules/leads/LeadDetailView";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!isModuloHabilitado(me.modulos, "LEADS")) redirect("/profile");
  return (
    <LeadDetailView
      id={id}
      rol={me.rol}
      usuarioId={me.usuario.id}
      whatsappHabilitado={isModuloHabilitado(me.modulos, "WHATSAPP")}
      inmueblesHabilitado={isModuloHabilitado(me.modulos, "INMUEBLES")}
    />
  );
}

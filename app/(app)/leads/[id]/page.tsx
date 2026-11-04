import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { isModuloHabilitado } from "@/src/lib/modules";
import LeadDetailView from "@/src/modules/leads/LeadDetailView";
import { tienePermiso } from "@/src/lib/permisos";

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
  if (!isModuloHabilitado(me.modulos, "LEADS") ||
    !tienePermiso(me.permisos, "leads.ver")
  ) redirect("/profile");
  return (
    <LeadDetailView
      id={id}
      usuarioId={me.usuario.id}
      whatsappHabilitado={isModuloHabilitado(me.modulos, "WHATSAPP")}
      inmueblesHabilitado={isModuloHabilitado(me.modulos, "INMUEBLES")}
    />
  );
}

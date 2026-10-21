import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { canManageOrganization } from "@/src/lib/roles";
import UsuariosEmpresaView from "@/src/modules/settings/users/UsuariosEmpresaView";
export default async function UsersPage() {
  const me = await getMe();
  if (!me || !canManageOrganization(me.rol)) redirect("/profile");
  return <UsuariosEmpresaView usuarioId={me.usuario.id} />;
}

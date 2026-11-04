import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import UsuariosEmpresaView from "@/src/modules/settings/users/UsuariosEmpresaView";
import { tienePermiso } from "@/src/lib/permisos";
export default async function UsersPage() {
  const me = await getMe();
  if (!me || !tienePermiso(me.permisos, "usuarios.gestionar")) redirect("/profile");
  return <UsuariosEmpresaView usuarioId={me.usuario.id} />;
}

import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { tienePermiso } from "@/src/lib/permisos";
import RolesEmpresaView from "@/src/modules/settings/roles/RolesEmpresaView";

export default async function RolesPage() {
  const me = await getMe();
  if (!me || !tienePermiso(me.permisos, "roles.gestionar")) redirect("/profile");
  return <RolesEmpresaView />;
}

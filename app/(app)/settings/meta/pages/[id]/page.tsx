import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { canManageOrganization } from "@/src/lib/roles";
import { isModuloHabilitado } from "@/src/lib/modules";
import MetaPageProfileView from "@/src/modules/settings/meta/MetaPageProfileView";

export default async function SettingsMetaPageProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMe();
  if (!me || !canManageOrganization(me.rol)) {
    redirect("/profile");
  }
  if (!isModuloHabilitado(me.modulos, "META_LEADS")) {
    redirect("/settings");
  }

  const { id } = await params;

  return <MetaPageProfileView id={id} />;
}

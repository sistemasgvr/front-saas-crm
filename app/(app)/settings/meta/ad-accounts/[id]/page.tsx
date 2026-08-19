import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { canManageOrganization } from "@/src/lib/roles";
import { isModuloHabilitado } from "@/src/lib/modules";
import MetaAdAccountProfileView from "@/src/modules/settings/meta/MetaAdAccountProfileView";

export default async function SettingsMetaAdAccountProfilePage({
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

  return <MetaAdAccountProfileView id={id} />;
}

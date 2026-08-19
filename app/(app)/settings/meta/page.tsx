import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { canManageOrganization } from "@/src/lib/roles";
import { isModuloHabilitado } from "@/src/lib/modules";
import MetaHubView from "@/src/modules/settings/meta/MetaHubView";

export default async function SettingsMetaPage({
  searchParams,
}: {
  searchParams: Promise<{ meta?: string }>;
}) {
  const me = await getMe();
  if (!me || !canManageOrganization(me.rol)) {
    redirect("/profile");
  }
  if (!isModuloHabilitado(me.modulos, "META_LEADS")) {
    redirect("/settings");
  }

  const { meta } = await searchParams;

  return <MetaHubView metaCallback={meta} />;
}

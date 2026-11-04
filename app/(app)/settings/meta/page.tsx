import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { isModuloHabilitado } from "@/src/lib/modules";
import MetaHubView from "@/src/modules/settings/meta/MetaHubView";
import { tienePermiso } from "@/src/lib/permisos";

export default async function SettingsMetaPage({
  searchParams,
}: {
  searchParams: Promise<{ meta?: string }>;
}) {
  const me = await getMe();
  if (!me || !tienePermiso(me.permisos, "meta.configurar")) {
    redirect("/profile");
  }
  if (!isModuloHabilitado(me.modulos, "META_LEADS")) {
    redirect("/settings");
  }

  const { meta } = await searchParams;

  return <MetaHubView metaCallback={meta} />;
}

import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { isModuloHabilitado } from "@/src/lib/modules";
import MetaPagesListView from "@/src/modules/settings/meta/MetaPagesListView";
import { tienePermiso } from "@/src/lib/permisos";

export default async function SettingsMetaPagesPage() {
  const me = await getMe();
  if (!me || !tienePermiso(me.permisos, "meta.configurar")) {
    redirect("/profile");
  }
  if (!isModuloHabilitado(me.modulos, "META_LEADS")) {
    redirect("/settings");
  }

  return <MetaPagesListView />;
}

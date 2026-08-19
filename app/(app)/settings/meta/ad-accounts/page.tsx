import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { canManageOrganization } from "@/src/lib/roles";
import { isModuloHabilitado } from "@/src/lib/modules";
import MetaAdAccountsListView from "@/src/modules/settings/meta/MetaAdAccountsListView";

export default async function SettingsMetaAdAccountsPage() {
  const me = await getMe();
  if (!me || !canManageOrganization(me.rol)) {
    redirect("/profile");
  }
  if (!isModuloHabilitado(me.modulos, "META_LEADS")) {
    redirect("/settings");
  }

  return <MetaAdAccountsListView />;
}

import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { canManageOrganization } from "@/src/lib/roles";
import { isModuloHabilitado } from "@/src/lib/modules";
import WhatsappSettingsView from "@/src/modules/settings/whatsapp/WhatsappSettingsView";

export default async function SettingsWhatsappPage() {
  const me = await getMe();
  if (!me || !canManageOrganization(me.rol)) {
    redirect("/profile");
  }
  if (!isModuloHabilitado(me.modulos, "WHATSAPP")) {
    redirect("/settings");
  }

  return <WhatsappSettingsView />;
}

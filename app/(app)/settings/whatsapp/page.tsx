import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { isModuloHabilitado } from "@/src/lib/modules";
import WhatsappSettingsView from "@/src/modules/settings/whatsapp/WhatsappSettingsView";
import { tienePermiso } from "@/src/lib/permisos";

export default async function SettingsWhatsappPage() {
  const me = await getMe();
  if (!me || !tienePermiso(me.permisos, "whatsapp.configurar")) {
    redirect("/profile");
  }
  if (!isModuloHabilitado(me.modulos, "WHATSAPP")) {
    redirect("/settings");
  }

  return <WhatsappSettingsView />;
}

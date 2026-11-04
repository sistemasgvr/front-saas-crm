import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { puedeVerConfiguracion } from "@/src/lib/permisos";
import SettingsView from "@/src/modules/settings/SettingsView";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ meta?: string }>;
}) {
  const me = await getMe();
  if (!me || !puedeVerConfiguracion(me.permisos)) {
    redirect("/profile");
  }

  const { meta } = await searchParams;

  if (meta) {
    redirect(`/settings/meta?meta=${meta}`);
  }

  return <SettingsView />;
}

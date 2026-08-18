import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { canManageOrganization } from "@/src/lib/roles";
import SettingsView from "@/src/modules/settings/SettingsView";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ meta?: string }>;
}) {
  const me = await getMe();
  if (!me || !canManageOrganization(me.rol)) {
    redirect("/profile");
  }

  const { meta } = await searchParams;

  return <SettingsView metaCallback={meta} />;
}

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

  return (
    <div>
      <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">Configuración</h1>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <SettingsView metaCallback={meta} />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getMeSafe } from "@/src/lib/auth";
import { getDefaultClientRoute } from "@/src/lib/modules";
import BackendUnavailable from "@/src/components/ui/BackendUnavailable";

export default async function RootPage() {
  const session = await getMeSafe();
  if (session.status === "unavailable") {
    return <BackendUnavailable message={session.message} />;
  }
  if (session.status === "unauthenticated") {
    redirect("/login");
  }
  const me = session.me;
  redirect(me.usuario.esAdminPlataforma ? "/admin/organizations" : getDefaultClientRoute(me));
}

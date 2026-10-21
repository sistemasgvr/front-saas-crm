import { redirect } from "next/navigation";
import { getMeSafe } from "@/src/lib/auth";
import BackendUnavailable from "@/src/components/ui/BackendUnavailable";
import CambiarPasswordTemporal from "@/src/modules/auth/CambiarPasswordTemporal";
export default async function ChangePasswordPage() {
  const session = await getMeSafe();
  if (session.status === "unauthenticated") redirect("/login");
  if (session.status === "unavailable")
    return <BackendUnavailable message={session.message} />;
  if (!session.me.usuario.debeCambiarPassword)
    redirect(
      session.me.usuario.esAdminPlataforma
        ? "/admin/organizations"
        : "/dashboard",
    );
  return <CambiarPasswordTemporal />;
}

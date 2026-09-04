import { redirect } from "next/navigation";
import LoginForm from "@/src/modules/auth/LoginForm";
import { getMeSafe } from "@/src/lib/auth";
import { getDefaultClientRoute } from "@/src/lib/modules";
import BackendUnavailable from "@/src/components/ui/BackendUnavailable";

export default async function LoginPage() {
  const session = await getMeSafe();
  if (session.status === "unavailable") {
    return <BackendUnavailable message={session.message} />;
  }
  if (session.status === "ok") {
    const me = session.me;
    redirect(me.usuario.esAdminPlataforma ? "/admin/organizations" : getDefaultClientRoute(me));
  }

  return <LoginForm />;
}

import { redirect } from "next/navigation";
import LoginForm from "@/src/modules/auth/LoginForm";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute } from "@/src/lib/modules";

export default async function LoginPage() {
  const me = await getMe();
  if (me) {
    redirect(me.usuario.esAdminPlataforma ? "/admin/organizations" : getDefaultClientRoute(me));
  }

  return <LoginForm />;
}

import { redirect } from "next/navigation";
import LoginForm from "@/src/modules/auth/LoginForm";
import { getMe } from "@/src/lib/auth";

export default async function LoginPage() {
  const me = await getMe();
  if (me) {
    redirect(me.usuario.esAdminPlataforma ? "/admin/organizations" : "/dashboard");
  }

  return <LoginForm />;
}

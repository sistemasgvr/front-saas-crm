import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";

export default async function RootPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  redirect(me.usuario.esAdminPlataforma ? "/admin/organizations" : "/dashboard");
}

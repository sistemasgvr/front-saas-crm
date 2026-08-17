import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute } from "@/src/lib/modules";

export default async function RootPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  redirect(me.usuario.esAdminPlataforma ? "/admin/organizations" : getDefaultClientRoute(me));
}

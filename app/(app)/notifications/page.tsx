import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import NotificationsListView from "@/src/modules/notifications/NotificationsListView";

export default async function NotificationsPage() {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (!me.organizacion) {
    redirect("/admin/organizations");
  }

  return <NotificationsListView />;
}

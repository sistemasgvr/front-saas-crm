import { redirect } from "next/navigation";
import { getMeSafe } from "@/src/lib/auth";
import { SidebarProvider } from "@/src/components/layout/SidebarContext";
import Sidebar, { type NavItem } from "@/src/components/layout/Sidebar";
import Header from "@/src/components/layout/Header";
import Backdrop from "@/src/components/layout/Backdrop";
import AppShell from "@/src/components/layout/AppShell";
import BackendUnavailable from "@/src/components/ui/BackendUnavailable";

const ADMIN_NAV: NavItem[] = [
  { name: "Empresas", icon: "mdi:office-building-outline", path: "/admin/organizations" },
  { name: "Usuarios", icon: "mdi:account-group-outline", path: "/admin/users" },
  { name: "Módulos", icon: "mdi:puzzle-outline", path: "/admin/modules" },
  { name: "Perfil", icon: "mdi:account-outline", path: "/admin/profile" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getMeSafe();
  if (session.status === "unavailable") {
    return <BackendUnavailable message={session.message} />;
  }
  if (session.status === "unauthenticated") {
    redirect("/login");
  }
  const me = session.me;

  if (!me.usuario.esAdminPlataforma) {
    redirect("/dashboard");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen xl:flex">
        <Sidebar items={ADMIN_NAV} homeHref="/admin/organizations" sectionTitle="Plataforma" />
        <Backdrop />
        <AppShell
          header={
            <Header
              nombre={me.usuario.nombre}
              email={me.usuario.email}
              organizacionNombre="Administrador SaaS"
              profileHref="/admin/profile"
              homeHref="/admin/organizations"
            />
          }
        >
          {children}
        </AppShell>
      </div>
    </SidebarProvider>
  );
}

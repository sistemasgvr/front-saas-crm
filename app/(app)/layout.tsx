import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { SidebarProvider } from "@/src/components/layout/SidebarContext";
import Sidebar, { type NavItem } from "@/src/components/layout/Sidebar";
import Header from "@/src/components/layout/Header";
import Backdrop from "@/src/components/layout/Backdrop";
import AppShell from "@/src/components/layout/AppShell";

const CLIENT_NAV: NavItem[] = [
  { name: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/dashboard", requiereModulo: "DASHBOARD" },
  { name: "Leads", icon: "mdi:account-multiple-outline", path: "/leads", requiereModulo: "META_LEADS" },
  { name: "Perfil", icon: "mdi:account-outline", path: "/profile" },
  { name: "Configuración", icon: "mdi:cog-outline", path: "/settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (me.usuario.esAdminPlataforma) {
    redirect("/admin/organizations");
  }

  const habilitados = new Set(me.modulos.filter((m) => m.habilitado).map((m) => m.codigo));
  const items = CLIENT_NAV.filter((item) => {
    if (item.requiereModulo && !habilitados.has(item.requiereModulo)) return false;
    if (item.path === "/settings" && me.rol === "USUARIO") return false;
    return true;
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen xl:flex">
        <Sidebar items={items} homeHref="/dashboard" />
        <Backdrop />
        <AppShell
          header={
            <Header
              nombre={me.usuario.nombre}
              email={me.usuario.email}
              organizacionNombre={me.organizacion?.nombre}
              profileHref="/profile"
              settingsHref={me.rol === "USUARIO" ? undefined : "/settings"}
            />
          }
        >
          {children}
        </AppShell>
      </div>
    </SidebarProvider>
  );
}

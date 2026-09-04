import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute } from "@/src/lib/modules";
import { SidebarProvider } from "@/src/components/layout/SidebarContext";
import Sidebar, { type NavItem } from "@/src/components/layout/Sidebar";
import Header from "@/src/components/layout/Header";
import Backdrop from "@/src/components/layout/Backdrop";
import AppShell from "@/src/components/layout/AppShell";

import { canManageOrganization } from "@/src/lib/roles";

const CLIENT_NAV: NavItem[] = [
  { name: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/dashboard", requiereModulo: "DASHBOARD" },
  { name: "Leads", icon: "mdi:account-multiple-outline", path: "/leads", requiereModulo: "META_LEADS" },
  { name: "Agenda", icon: "mdi:calendar-month-outline", path: "/agenda", requiereModulo: "META_LEADS" },
  { name: "Inmuebles", icon: "mdi:home-city-outline", path: "/inmuebles", requiereModulo: "CRM" },
  { name: "Chats", icon: "mdi:whatsapp", path: "/chats", requiereModulo: "WHATSAPP" },
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
    if (item.path === "/settings" && !canManageOrganization(me.rol)) return false;
    return true;
  });

  const homeHref = getDefaultClientRoute(me);

  return (
    <SidebarProvider>
      <div className="min-h-screen xl:flex">
        <Sidebar items={items} homeHref={homeHref} />
        <Backdrop />
        <AppShell
          header={
            <Header
              nombre={me.usuario.nombre}
              email={me.usuario.email}
              organizacionId={me.organizacion?.id}
              organizacionNombre={me.organizacion?.nombre}
              profileHref="/profile"
              settingsHref={canManageOrganization(me.rol) ? "/settings" : undefined}
              homeHref={homeHref}
            />
          }
        >
          {children}
        </AppShell>
      </div>
    </SidebarProvider>
  );
}

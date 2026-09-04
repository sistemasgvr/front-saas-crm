import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { getDefaultClientRoute } from "@/src/lib/modules";
import { SidebarProvider } from "@/src/components/layout/SidebarContext";
import Sidebar, { type NavGroup, type NavItem } from "@/src/components/layout/Sidebar";
import Header from "@/src/components/layout/Header";
import Backdrop from "@/src/components/layout/Backdrop";
import AppShell from "@/src/components/layout/AppShell";

import { canManageOrganization } from "@/src/lib/roles";

const CLIENT_NAV_GROUPS: NavGroup[] = [
  {
    title: "General",
    items: [
      { name: "Dashboard", icon: "mdi:view-dashboard-outline", path: "/dashboard", requiereModulo: "DASHBOARD" },
    ],
  },
  {
    title: "CRM",
    items: [
      { name: "Inmuebles", icon: "mdi:home-city-outline", path: "/inmuebles", requiereModulo: "CRM" },
    ],
  },
  {
    title: "Meta Leads",
    items: [
      { name: "Leads", icon: "mdi:account-multiple-outline", path: "/leads", requiereModulo: "META_LEADS" },
      { name: "Agenda", icon: "mdi:calendar-month-outline", path: "/agenda", requiereModulo: "META_LEADS" },
    ],
  },
  {
    title: "WhatsApp",
    items: [
      { name: "Chats", icon: "mdi:whatsapp", path: "/chats", requiereModulo: "WHATSAPP" },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { name: "Perfil", icon: "mdi:account-outline", path: "/profile" },
      { name: "Configuración", icon: "mdi:cog-outline", path: "/settings" },
    ],
  },
];

function filtrarGrupo(
  group: NavGroup,
  habilitados: Set<string>,
  rol: string | null,
): NavGroup | null {
  const items = group.items.filter((item: NavItem) => {
    if (item.requiereModulo && !habilitados.has(item.requiereModulo)) return false;
    if (item.path === "/settings" && !canManageOrganization(rol)) return false;
    return true;
  });
  if (items.length === 0) return null;
  return { title: group.title, items };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }
  if (me.usuario.esAdminPlataforma) {
    redirect("/admin/organizations");
  }

  const habilitados = new Set(me.modulos.filter((m) => m.habilitado).map((m) => m.codigo));
  const groups = CLIENT_NAV_GROUPS.map((g) => filtrarGrupo(g, habilitados, me.rol)).filter(
    (g): g is NavGroup => g !== null,
  );

  const homeHref = getDefaultClientRoute(me);

  return (
    <SidebarProvider>
      <div className="min-h-screen xl:flex">
        <Sidebar groups={groups} homeHref={homeHref} />
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

import GuideProvider from "@/src/modules/guides/GuideProvider";
import "driver.js/dist/driver.css";
import "@/src/modules/guides/guides.css";
import { redirect } from "next/navigation";
import { getMeSafe } from "@/src/lib/auth";
import { getDefaultClientRoute } from "@/src/lib/modules";
import { SidebarProvider } from "@/src/components/layout/SidebarContext";
import Sidebar, {
  type NavGroup,
  type NavItem,
} from "@/src/components/layout/Sidebar";
import Header from "@/src/components/layout/Header";
import Backdrop from "@/src/components/layout/Backdrop";
import AppShell from "@/src/components/layout/AppShell";
import BackendUnavailable from "@/src/components/ui/BackendUnavailable";

import { canManageOrganization, canViewOrgDashboard } from "@/src/lib/roles";

const CLIENT_NAV_GROUPS: NavGroup[] = [
  {
    title: "CRM",
    items: [
      {
        name: "Dashboard",
        icon: "mdi:view-dashboard-outline",
        path: "/dashboard",
        requiereModulo: "DASHBOARD",
      },
      {
        name: "Leads",
        icon: "mdi:account-multiple-outline",
        path: "/leads",
        requiereModulo: "LEADS",
      },
      {
        name: "Agenda",
        icon: "mdi:calendar-month-outline",
        path: "/agenda",
        requiereModulo: "LEADS",
      },
      {
        name: "Inmuebles",
        icon: "mdi:home-city-outline",
        path: "/inmuebles",
        requiereModulo: "INMUEBLES",
      },
    ],
  },
  {
    title: "Meta",
    items: [
      {
        name: "Chats",
        icon: "mdi:whatsapp",
        path: "/chats",
        requiereModulo: "WHATSAPP",
      },
      {
        name: "Llamadas",
        icon: "mdi:phone",
        path: "/llamadas",
        requiereModulo: "WHATSAPP",
      },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { name: "Guía del sistema", icon: "mdi:compass-outline", path: "/ayuda" },
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
    if (item.requiereModulo && !habilitados.has(item.requiereModulo))
      return false;
    if (item.path === "/dashboard" && !canViewOrgDashboard(rol)) return false;
    if (item.path === "/settings" && !canManageOrganization(rol)) return false;
    return true;
  });
  if (items.length === 0) return null;
  return { title: group.title, items };
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getMeSafe();
  if (session.status === "unavailable") {
    return <BackendUnavailable message={session.message} />;
  }
  if (session.status === "unauthenticated") {
    redirect("/login");
  }
  const me = session.me;
  if (me.usuario.debeCambiarPassword) redirect("/cambiar-password");

  if (me.usuario.esAdminPlataforma) {
    redirect("/admin/organizations");
  }

  const habilitados = new Set(
    me.modulos.filter((m) => m.habilitado).map((m) => m.codigo),
  );
  const groups = CLIENT_NAV_GROUPS.map((g) =>
    filtrarGrupo(g, habilitados, me.rol),
  ).filter((g): g is NavGroup => g !== null);

  const homeHref = getDefaultClientRoute(me);

  return (
    <SidebarProvider>
      <GuideProvider me={me}>
        <div className="min-h-screen xl:flex">
          <Sidebar
            groups={groups}
            homeHref={homeHref}
            logoUrl={me.organizacion?.logoUrl}
            organizationName={me.organizacion?.nombre}
          />
          <Backdrop />
          <AppShell
            header={
              <Header
                nombre={me.usuario.nombre}
                email={me.usuario.email}
                organizacionId={me.organizacion?.id}
                organizacionNombre={me.organizacion?.nombre}
                organizacionLogoUrl={me.organizacion?.logoUrl}
                profileHref="/profile"
                settingsHref={
                  canManageOrganization(me.rol) ? "/settings" : undefined
                }
                homeHref={homeHref}
              />
            }
          >
            {children}
          </AppShell>
        </div>
      </GuideProvider>
    </SidebarProvider>
  );
}

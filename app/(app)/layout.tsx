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

import { puedeVerConfiguracion, tienePermiso } from "@/src/lib/permisos";
import { PermisosProvider } from "@/src/context/PermisosContext";

const CLIENT_NAV_GROUPS: NavGroup[] = [
  {
    title: "CRM",
    items: [
      {
        name: "Dashboard",
        icon: "mdi:view-dashboard-outline",
        path: "/dashboard",
        requiereModulo: "DASHBOARD",
        requierePermiso: "dashboard.ver",
      },
      {
        name: "Leads",
        icon: "mdi:account-multiple-outline",
        path: "/leads",
        requiereModulo: "LEADS",
        requierePermiso: "leads.ver",
      },
      {
        name: "Agenda",
        icon: "mdi:calendar-month-outline",
        path: "/agenda",
        requiereModulo: "LEADS",
        requierePermiso: "leads.ver",
      },
      {
        name: "Inmuebles",
        icon: "mdi:home-city-outline",
        path: "/inmuebles",
        requiereModulo: "INMUEBLES",
        requierePermiso: "inmuebles.ver",
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
        requierePermiso: "chats.ver",
      },
      {
        name: "Llamadas",
        icon: "mdi:phone",
        path: "/llamadas",
        requiereModulo: "WHATSAPP",
        requierePermiso: "llamadas.usar",
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
  permisos: readonly string[],
): NavGroup | null {
  const items = group.items.filter((item: NavItem) => {
    if (item.requiereModulo && !habilitados.has(item.requiereModulo))
      return false;
    if (item.requierePermiso && !tienePermiso(permisos, item.requierePermiso))
      return false;
    if (item.path === "/settings" && !puedeVerConfiguracion(permisos))
      return false;
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
    filtrarGrupo(g, habilitados, me.permisos),
  ).filter((g): g is NavGroup => g !== null);

  const homeHref = getDefaultClientRoute(me);

  return (
    <PermisosProvider permisos={me.permisos ?? []}>
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
                  puedeVerConfiguracion(me.permisos) ? "/settings" : undefined
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
    </PermisosProvider>
  );
}

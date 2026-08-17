import { redirect } from "next/navigation";
import { getMe } from "@/src/lib/auth";
import { SidebarProvider } from "@/src/components/layout/SidebarContext";
import Sidebar from "@/src/components/layout/Sidebar";
import Header from "@/src/components/layout/Header";
import Backdrop from "@/src/components/layout/Backdrop";
import AppShell from "@/src/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) {
    redirect("/login");
  }

  const modulosHabilitados = new Set(me.modulos.filter((m) => m.habilitado).map((m) => m.codigo));

  return (
    <SidebarProvider>
      <div className="min-h-screen xl:flex">
        <Sidebar modulosHabilitados={modulosHabilitados} />
        <Backdrop />
        <AppShell
          header={
            <Header
              nombre={me.usuario.nombre}
              email={me.usuario.email}
              organizacionNombre={me.organizacion?.nombre}
            />
          }
        >
          {children}
        </AppShell>
      </div>
    </SidebarProvider>
  );
}

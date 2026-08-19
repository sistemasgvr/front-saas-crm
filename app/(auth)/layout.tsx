import GridShape from "@/src/components/common/GridShape";
import ThemeTogglerTwo from "@/src/components/common/ThemeTogglerTwo";
import AppLogo from "@/src/components/ui/AppLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-1 bg-white p-6 dark:bg-gray-900 sm:p-0">
      <div className="relative flex h-screen w-full flex-col justify-center dark:bg-gray-900 lg:flex-row sm:p-0">
        {children}
        <div className="hidden h-full w-full items-center bg-brand-950 dark:bg-white/5 lg:grid lg:w-1/2">
          <div className="relative z-1 flex items-center justify-center">
            <GridShape />
            <div className="flex max-w-sm flex-col items-center">
              <AppLogo variant="full" width={240} height={60} className="mb-4" priority />
              <p className="text-center text-gray-400 dark:text-white/60">
                Panel de gestión de leads y campañas Meta
              </p>
            </div>
          </div>
        </div>
        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}

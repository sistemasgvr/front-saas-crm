import Link from "next/link";
import AppLogo from "@/src/components/ui/AppLogo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-white/90">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/login" className="inline-flex items-center gap-2">
            <AppLogo variant="icon" width={36} height={36} />
            <span className="text-theme-sm font-semibold">CRM</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-theme-xs text-gray-500 dark:text-gray-400">
            <Link href="/privacidad" className="hover:text-brand-600 dark:hover:text-brand-400">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-brand-600 dark:hover:text-brand-400">
              Términos
            </Link>
            <Link
              href="/eliminacion-datos"
              className="hover:text-brand-600 dark:hover:text-brand-400"
            >
              Eliminación de datos
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      <footer className="border-t border-gray-200 py-6 text-center text-theme-xs text-gray-400 dark:border-gray-800">
        © {new Date().getFullYear()} Proyectos GVR — CRM
      </footer>
    </div>
  );
}

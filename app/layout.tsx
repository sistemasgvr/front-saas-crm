import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { QueryProvider } from "@/src/lib/query/QueryProvider";
import { AppToaster } from "@/src/components/ui/Toaster";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM",
  description: "Panel de gestión de leads y campañas Meta",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CRM",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/images/logo/logo-crm.png",
    apple: "/images/logo/logo-crm.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <AppToaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

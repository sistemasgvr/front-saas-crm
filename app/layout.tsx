import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/src/context/ThemeContext";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GVR CRM",
  description: "Panel de gestión de leads y campañas Meta",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

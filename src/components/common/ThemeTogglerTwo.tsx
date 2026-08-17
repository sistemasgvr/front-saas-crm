"use client";

import { Icon } from "@/src/components/ui/Icon";
import { useTheme } from "@/src/context/ThemeContext";

export default function ThemeTogglerTwo() {
  const { toggleTheme, theme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="inline-flex size-14 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600"
    >
      <Icon name="solar:sun-bold" size={20} className="hidden dark:block" />
      <Icon name="solar:moon-bold" size={20} className="dark:hidden" />
    </button>
  );
}

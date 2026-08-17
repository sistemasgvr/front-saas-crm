"use client";

import { Icon } from "@/src/components/ui/Icon";
import { useTheme } from "@/src/context/ThemeContext";

export const ThemeToggleButton: React.FC = () => {
  const { toggleTheme, theme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <Icon name="solar:sun-bold" size={20} className="hidden dark:block" />
      <Icon name="solar:moon-bold" size={20} className="dark:hidden" />
    </button>
  );
};

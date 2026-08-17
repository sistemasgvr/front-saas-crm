"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/src/context/ThemeContext";

export function AppToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      expand={false}
    />
  );
}

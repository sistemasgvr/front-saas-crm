"use client";

import { useEffect, useState } from "react";

/** Keep content mounted while exit animation plays. */
export function useOpenTransition(open: boolean, durationMs = 160) {
  const [visible, setVisible] = useState(open);
  const [entered, setEntered] = useState(false);

  // Ajuste durante el render (patrón de React para estado derivado de props):
  // abrir monta el contenido de inmediato; cerrar quita "entered" para que
  // arranque la animación de salida.
  if (open && !visible) setVisible(true);
  if (!open && entered) setEntered(false);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }

    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs]);

  return { visible, entered };
}

/** Fade + slight slide/scale for popovers, filters and menus. */
export function popoverMotionClass(entered: boolean) {
  return `origin-top transition-[opacity,transform] duration-150 ease-out ${
    entered
      ? "translate-y-0 scale-100 opacity-100"
      : "pointer-events-none -translate-y-1 scale-[0.97] opacity-0"
  }`;
}

"use client";

import { useEffect, useState } from "react";

/** Keep content mounted while exit animation plays. */
export function useOpenTransition(open: boolean, durationMs = 160) {
  const [visible, setVisible] = useState(open);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }

    setEntered(false);
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

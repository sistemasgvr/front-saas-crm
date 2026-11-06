import { extendTailwindMerge } from "tailwind-merge";

/**
 * Une clases de Tailwind resolviendo conflictos: la última gana
 * (`cn("px-4 py-2.5", "px-3 py-1.5")` → `"px-3 py-1.5"`).
 *
 * Úsalo en componentes compartidos que aceptan `className`: sin él, una
 * clase del caller como `py-1.5` puede perder contra el `py-2.5` del base
 * según el orden del CSS (así se cortaban los selects de los filtros).
 *
 * Registra los tokens propios del tema (app/globals.css) para que
 * `text-theme-sm` cuente como tamaño de letra y no borre `text-gray-400`.
 */
export const cn = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: ["theme-xs", "theme-sm", "theme-xl", "title-sm", "title-md", "title-lg", "title-xl", "title-2xl"],
        },
      ],
      shadow: [{ shadow: ["theme-xs", "theme-sm", "theme-md", "theme-lg", "theme-xl"] }],
    },
  },
});

"use client";

import { Icon } from "@/src/components/ui/Icon";

interface HelpTooltipProps {
  content: string;
  /** Texto accesible del botón (lectores de pantalla). */
  label?: string;
  className?: string;
  iconSize?: number;
  placement?: "top" | "bottom";
  /** Alinea el globo al icono. `end` evita que se corte en el borde derecho. */
  align?: "center" | "end";
}

/**
 * Icono de ayuda (?) con texto al pasar el puntero o al enfocar con teclado.
 */
export default function HelpTooltip({
  content,
  label = "Más información",
  className = "",
  iconSize = 16,
  placement = "top",
  align = "center",
}: HelpTooltipProps) {
  const verticalClasses =
    placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2";
  const horizontalClasses =
    align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";

  const arrowVertical =
    placement === "bottom"
      ? "bottom-full -mb-px border-x-transparent border-b-gray-800 dark:border-b-gray-700"
      : "top-full -mt-px border-x-transparent border-t-gray-800 dark:border-t-gray-700";
  const arrowHorizontal = align === "end" ? "right-2" : "left-1/2 -translate-x-1/2";

  return (
    <span className={`group/help relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        tabIndex={0}
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300"
        onClick={(e) => e.preventDefault()}
      >
        <Icon name="mdi:help-circle-outline" size={iconSize} />
      </button>

      <span
        role="tooltip"
        className={`pointer-events-none invisible absolute z-[80] w-max max-w-[16rem] rounded-lg border border-gray-800 bg-gray-800 px-3 py-2 text-left text-theme-xs leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/help:visible group-hover/help:opacity-100 group-focus-within/help:visible group-focus-within/help:opacity-100 dark:border-gray-700 dark:bg-gray-900 ${verticalClasses} ${horizontalClasses}`}
      >
        {content}
        <span
          className={`absolute h-0 w-0 border-4 border-transparent ${arrowVertical} ${arrowHorizontal}`}
          aria-hidden
        />
      </span>
    </span>
  );
}

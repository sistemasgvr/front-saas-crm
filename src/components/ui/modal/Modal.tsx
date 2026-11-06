"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Franja fija arriba (título, avatar, etc.) — no se mueve al scrollear el contenido. */
  header?: ReactNode;
  /** Franja fija abajo (botones de acción) — no se mueve al scrollear el contenido. */
  footer?: ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

/**
 * Overlay a nivel viewport — z-99999 para quedar sobre sidebar/header (z-50 / z-99999).
 * Renderiza en document.body vía portal.
 *
 * Layout fijo en 3 franjas: `header` y `footer` (opcionales) quedan quietos,
 * solo `children` scrollea — así un modal con contenido largo (formularios,
 * paneles completos) nunca esconde el título ni los botones de acción.
 * Quien llama solo llena children (y header/footer si los necesita); no
 * arma su propio contenedor de scroll. Los botones de acción van siempre en
 * `footer` (ver ModalFooter), nunca dentro de children.
 */
export default function Modal({
  open,
  onClose,
  children,
  header,
  footer,
  className = "",
  showCloseButton = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  // Overlay, panel y botón de cierre: estilo de ui/modal del template TailAdmin.
  return createPortal(
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="fixed inset-0 h-full w-full cursor-default bg-gray-400/50 backdrop-blur-[32px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`relative z-10 flex max-h-[min(90vh,720px)] w-full flex-col overflow-hidden rounded-3xl bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 ${
          className.includes("max-w-") ? className : `max-w-lg ${className}`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-4 sm:top-2.5 sm:h-11 sm:w-11"
            aria-label="Cerrar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}

        {header && (
          <div className="shrink-0 border-b border-gray-100 dark:border-gray-800">{header}</div>
        )}

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-gray-100 dark:border-gray-800">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

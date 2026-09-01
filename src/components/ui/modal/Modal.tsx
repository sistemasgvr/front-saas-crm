"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/src/components/ui/Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

/**
 * Overlay a nivel viewport — z-99999 para quedar sobre sidebar/header (z-50 / z-99999).
 * Renderiza en document.body vía portal.
 */
export default function Modal({
  open,
  onClose,
  children,
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

  return createPortal(
    <div
      className="fixed inset-0 z-99999 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="fixed inset-0 h-full w-full cursor-default bg-gray-900/60 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`relative z-10 w-full max-w-lg max-h-[min(90vh,720px)] overflow-y-auto rounded-t-2xl border border-gray-200 bg-white shadow-theme-lg sm:rounded-2xl dark:border-gray-800 dark:bg-gray-900 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <Icon name="mdi:close" size={20} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

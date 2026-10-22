"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/src/components/ui/Icon";
import { guideMatches } from "./catalog";
import { useGuides } from "./GuideProvider";

export default function GuideLauncher() {
  const context = useGuides();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  if (!context) return null;
  const current = context.guides.filter((g) => guideMatches(g, pathname));
  return (
    <div className="relative shrink-0" ref={root} data-tour="guide-launcher">
      <button
        type="button"
        aria-label="Recorrido de esta pantalla"
        title="Recorridos y ayuda"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
      >
        <Icon name="mdi:help-circle-outline" size={21} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[100000] mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <p className="px-2 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Aprender en esta pantalla
          </p>
          {current.map((g) => (
            <div
              key={g.id}
              className="mb-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800"
            >
              <button
                type="button"
                disabled={context.busy}
                className="w-full text-left text-sm font-medium text-gray-800 disabled:opacity-50 dark:text-gray-100"
                onClick={() => {
                  setOpen(false);
                  void context.start(
                    g.id,
                    !context.storage.tours[g.id]?.completed,
                  );
                }}
              >
                <span className="mr-1 text-brand-500">▶</span> {g.title}
              </button>
              {context.storage.tours[g.id] &&
                !context.storage.tours[g.id].completed && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void context.start(g.id);
                    }}
                    className="mt-1 text-xs text-gray-500 underline dark:text-gray-400"
                  >
                    Reiniciar recorrido
                  </button>
                )}
            </div>
          ))}
          {current.length === 0 && (
            <p className="px-2 pb-3 text-sm text-gray-500 dark:text-gray-400">
              Encuentra los recorridos por módulo en la guía.
            </p>
          )}
          <Link
            href="/ayuda"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
          >
            <Icon name="mdi:compass-outline" size={18} /> Todos los recorridos
          </Link>
        </div>
      )}
    </div>
  );
}

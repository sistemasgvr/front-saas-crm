"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/src/components/ui/Icon";
import { popoverMotionClass, useOpenTransition } from "@/src/components/ui/use-open-transition";
import type { DynamicFilterOption } from "./types";

interface SelectSearchProps {
  value: string;
  options: DynamicFilterOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function SelectSearch({
  value,
  options,
  placeholder = "Seleccionar",
  searchPlaceholder = "Buscar...",
  disabled = false,
  onChange,
}: SelectSearchProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const { visible, entered } = useOpenTransition(open);
  const [q, setQ] = useState("");
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, q]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 280);
    const maxWidth = Math.min(window.innerWidth - 32, 420);
    const width = Math.min(Math.max(rect.width, minWidth), maxWidth);
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
    setMenuStyle({ top: rect.bottom + 4, left, width });
  };

  useLayoutEffect(() => {
    if (!visible) return;
    updateMenuPosition();
  }, [visible]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  const menu = visible && portalReady && (
    <div
      ref={menuRef}
      role="listbox"
      className={`app-select-search-dropdown fixed z-[100001] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900 ${popoverMotionClass(entered)}`}
      style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
    >
      <div className="border-b border-gray-100 p-2 dark:border-gray-800">
        <input
          autoFocus={open}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 text-sm text-gray-800 outline-none dark:border-gray-700 dark:text-white/90"
        />
      </div>
      <ul className="custom-scrollbar max-h-48 overflow-y-auto overflow-x-hidden py-1">
        <li>
          <button
            type="button"
            className="flex w-full min-w-0 px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <span className="truncate">{placeholder}</span>
          </button>
        </li>
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
        ) : (
          filtered.map((option) => (
            <li key={option.value} className="min-w-0">
              <button
                type="button"
                title={option.label}
                className={`flex w-full min-w-0 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                  option.value === value
                    ? "font-medium text-brand-600 dark:text-brand-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="block min-w-0 truncate">{option.label}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        title={selected?.label}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
          setQ("");
        }}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm shadow-theme-xs transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 ${
          selected
            ? "border-gray-300 text-gray-800 dark:border-gray-700 dark:text-white/90"
            : "border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-400"
        }`}
      >
        <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
        <Icon
          name="mdi:chevron-down"
          size={18}
          className={`shrink-0 text-gray-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {portalReady ? createPortal(menu, document.body) : null}
    </div>
  );
}

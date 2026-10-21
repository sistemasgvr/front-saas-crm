"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/src/components/ui/Icon";
import {
  popoverMotionClass,
  useOpenTransition,
} from "@/src/components/ui/use-open-transition";

export interface MultiSelectOption {
  value: string;
  label: string;
  /** Texto secundario bajo la etiqueta (ej. código). */
  description?: string;
  icon?: string;
}

interface MultiSelectProps {
  id?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
}

/**
 * Selección múltiple controlada: chips en el disparador y menú con casillas
 * en portal (no lo recorta un Modal ni un contenedor con overflow).
 */
export default function MultiSelect({
  id,
  options,
  value,
  onChange,
  onBlur,
  placeholder = "Selecciona una o más opciones",
  searchPlaceholder = "Buscar...",
  emptyText = "No hay opciones disponibles",
  disabled = false,
  error = false,
  hint,
}: MultiSelectProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { visible, entered } = useOpenTransition(open);
  const [q, setQ] = useState("");
  const [menuStyle, setMenuStyle] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  }>({ top: 0, left: 0, width: 0, maxHeight: 240 });
  const listboxId = useId();
  const onBlurRef = useRef(onBlur);
  useEffect(() => {
    onBlurRef.current = onBlur;
  });

  const seleccion = useMemo(() => new Set(value), [value]);
  const seleccionadas = options.filter((option) => seleccion.has(option.value));
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.description?.toLowerCase().includes(term),
    );
  }, [options, q]);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 260), window.innerWidth - 32);
    const left = Math.min(
      Math.max(16, rect.left),
      window.innerWidth - width - 16,
    );
    // Abre hacia arriba si abajo no cabe la lista (pantallas bajas, modales).
    const abajo = window.innerHeight - rect.bottom - 16;
    const arriba = rect.top - 16;
    if (abajo < 220 && arriba > abajo) {
      setMenuStyle({
        bottom: window.innerHeight - rect.top + 4,
        left,
        width,
        maxHeight: Math.min(320, arriba),
      });
    } else {
      setMenuStyle({
        top: rect.bottom + 4,
        left,
        width,
        maxHeight: Math.min(320, Math.max(abajo, 160)),
      });
    }
  };

  useLayoutEffect(() => {
    if (!visible) return;
    updateMenuPosition();
  }, [visible, value.length]);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      onBlurRef.current?.();
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
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

  const toggle = (optionValue: string) => {
    onChange(
      seleccion.has(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );
  };

  // `visible` es false en el servidor y en el primer render: el portal nunca se hidrata.
  const menu = visible && (
    <div
      id={listboxId}
      ref={menuRef}
      role="listbox"
      aria-multiselectable="true"
      className={`fixed z-[100001] flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900 ${popoverMotionClass(entered)}`}
      style={{
        top: menuStyle.top,
        bottom: menuStyle.bottom,
        left: menuStyle.left,
        width: menuStyle.width,
        maxHeight: menuStyle.maxHeight,
      }}
    >
      {options.length > 6 && (
        <div className="border-b border-gray-100 p-2 dark:border-gray-800">
          <input
            autoFocus={open}
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 text-sm text-gray-800 outline-none dark:border-gray-700 dark:text-white/90"
          />
        </div>
      )}
      <ul className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-gray-400">
            {options.length === 0 ? emptyText : "Sin resultados"}
          </li>
        ) : (
          filtered.map((option) => {
            const checked = seleccion.has(option.value);
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(option.value)}
                  className={`flex w-full min-w-0 items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                    checked ? "bg-brand-500/5" : ""
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.25px] transition ${
                      checked
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-300 bg-transparent dark:border-gray-700"
                    }`}
                  >
                    {checked && <Icon name="mdi:check" size={14} />}
                  </span>
                  {option.icon && (
                    <Icon
                      name={option.icon}
                      size={18}
                      className="shrink-0 text-gray-500 dark:text-gray-400"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-gray-800 dark:text-white/90">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  return (
    <div className="min-w-0">
      <div
        id={id}
        ref={triggerRef}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
          setQ("");
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm shadow-theme-xs outline-hidden transition focus:ring-3 dark:bg-gray-900 ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        } ${
          error
            ? "border-error-500 focus:ring-error-500/10"
            : open
              ? "border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800"
              : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {seleccionadas.length > 0 ? (
            seleccionadas.map((option) => (
              <span
                key={option.value}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-gray-100 py-0.5 pl-2.5 pr-1 text-theme-xs font-medium text-gray-700 dark:bg-white/5 dark:text-white/80"
              >
                <span className="truncate">{option.label}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle(option.value);
                  }}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10"
                  aria-label={`Quitar ${option.label}`}
                >
                  <Icon name="mdi:close" size={12} />
                </button>
              </span>
            ))
          ) : (
            <span className="py-1 text-gray-400 dark:text-gray-400">
              {placeholder}
            </span>
          )}
        </div>
        <Icon
          name="mdi:chevron-down"
          size={18}
          className={`shrink-0 text-gray-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </div>
      {hint ? (
        <p
          className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}
        >
          {hint}
        </p>
      ) : null}
      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

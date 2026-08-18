"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Checkbox from "@/src/components/form/input/Checkbox";
import Input from "@/src/components/form/input/InputField";
import Select from "@/src/components/form/Select";
import { Icon } from "@/src/components/ui/Icon";
import SelectSearch from "./SelectSearch";
import {
  countActiveFilters,
  isActiveFilterValue,
  type DynamicFilterFieldDef,
  type DynamicFilterValues,
} from "./types";

interface DynamicFiltersProps {
  fields: DynamicFilterFieldDef[];
  values: DynamicFilterValues;
  onChange: (values: DynamicFilterValues) => void;
}

function nextValues(current: DynamicFilterValues, key: string, value: string): DynamicFilterValues {
  const next = { ...current, [key]: value };
  if (!value) delete next[key];
  return next;
}

export default function DynamicFilters({ fields, values, onChange }: DynamicFiltersProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState({
    top: 0,
    left: 0,
    maxHeight: 800,
  });
  const activeCount = countActiveFilters(values);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePanelPosition = useCallback(() => {
    const trigger = rootRef.current;
    const panel = panelRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = Math.min(window.innerWidth - 32, 448);
    const left = Math.min(Math.max(16, rect.right - panelWidth), window.innerWidth - panelWidth - 16);
    const viewportPadding = 16;
    const maxHeight = window.innerHeight - viewportPadding * 2;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    let top = rect.bottom + gap;

    if (panel) {
      const panelHeight = Math.min(panel.scrollHeight, maxHeight);
      if (top + panelHeight > window.innerHeight - viewportPadding && spaceAbove > spaceBelow) {
        top = Math.max(viewportPadding, rect.top - panelHeight - gap);
      }
      if (top + panelHeight > window.innerHeight - viewportPadding) {
        top = Math.max(viewportPadding, window.innerHeight - viewportPadding - panelHeight);
      }
    }

    setPanelStyle({ top, left, maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const frame = requestAnimationFrame(() => updatePanelPosition());
    return () => cancelAnimationFrame(frame);
  }, [open, fields, values, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      if (target.closest(".app-select-search-dropdown, [role=\"listbox\"]")) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  const setField = (key: string, value: string) => {
    onChange(nextValues(values, key, value));
  };

  const clearAll = () => onChange({});

  const panel = open && mounted && (
    <div
      ref={panelRef}
      style={{ top: panelStyle.top, left: panelStyle.left, maxHeight: panelStyle.maxHeight }}
      className="fixed z-[100000] flex w-[min(100vw-2rem,28rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {fields.map((field) => {
            const value = values[field.key] ?? "";
            return (
              <div
                key={field.key}
                className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto] items-start gap-2"
              >
                <div className="flex h-11 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
                  <span className="truncate">{field.label}</span>
                </div>

                {field.type === "select" && field.searchable ? (
                  <SelectSearch
                    value={value}
                    options={field.options ?? []}
                    placeholder={field.placeholder ?? "Seleccionar"}
                    searchPlaceholder={field.searchPlaceholder ?? "Buscar..."}
                    disabled={field.disabled}
                    onChange={(next) => setField(field.key, next)}
                  />
                ) : field.type === "select" ? (
                  <Select
                    value={value}
                    options={field.options ?? []}
                    placeholder={field.placeholder ?? "Seleccionar"}
                    disabled={field.disabled}
                    onChange={(next) => setField(field.key, next)}
                  />
                ) : field.type === "date" ? (
                  <Input
                    type="date"
                    value={value}
                    onChange={(event) => setField(field.key, event.target.value)}
                  />
                ) : field.type === "checkbox" ? (
                  <div className="flex min-h-11 items-center rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                    <Checkbox
                      checked={value === "true"}
                      label={field.placeholder ?? "Sí"}
                      onChange={(checked) => setField(field.key, checked ? "true" : "")}
                    />
                  </div>
                ) : (
                  <Input
                    type="search"
                    value={value}
                    placeholder={field.placeholder ?? "Valor"}
                    onChange={(event) => setField(field.key, event.target.value)}
                  />
                )}

                <button
                  type="button"
                  title="Limpiar filtro"
                  disabled={!isActiveFilterValue(value)}
                  onClick={() => setField(field.key, "")}
                  className="inline-flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/5 dark:hover:text-brand-400"
                >
                  <Icon name="mdi:broom" size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
        <button
          type="button"
          disabled={activeCount === 0}
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40 dark:text-gray-400 dark:hover:text-brand-400"
        >
          <Icon name="mdi:broom" size={16} />
          Limpiar todo
        </button>
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Filtros"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
          activeCount > 0
            ? "border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        }`}
      >
        <Icon name="mdi:filter-outline" size={18} />
        {activeCount > 0 && <span className="tabular-nums">{activeCount}</span>}
      </button>
      {mounted ? createPortal(panel, document.body) : null}
    </div>
  );
}

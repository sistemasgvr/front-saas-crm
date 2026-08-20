"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Checkbox from "@/src/components/form/input/Checkbox";
import Input from "@/src/components/form/input/InputField";
import Select from "@/src/components/form/Select";
import { Icon } from "@/src/components/ui/Icon";
import { popoverMotionClass, useOpenTransition } from "@/src/components/ui/use-open-transition";
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

const COMPACT_CONTROL = "!h-9 px-3 py-1.5 text-theme-sm";
const COMPACT_SELECT = "!h-9 px-3 py-1.5 pr-9 text-theme-sm";

function nextValues(current: DynamicFilterValues, key: string, value: string): DynamicFilterValues {
  const next = { ...current, [key]: value };
  if (!value) delete next[key];
  return next;
}

/** Empareja dos fechas consecutivas (Desde/Hasta) en una sola fila. */
function agruparCampos(fields: DynamicFilterFieldDef[]): DynamicFilterFieldDef[][] {
  const rows: DynamicFilterFieldDef[][] = [];
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    const next = fields[i + 1];
    if (field.type === "date" && next?.type === "date") {
      rows.push([field, next]);
      i += 1;
    } else {
      rows.push([field]);
    }
  }
  return rows;
}

export default function DynamicFilters({ fields, values, onChange }: DynamicFiltersProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const { visible, entered } = useOpenTransition(open);
  const [panelStyle, setPanelStyle] = useState({
    top: 0,
    left: 0,
    maxHeight: 800,
  });
  const activeCount = countActiveFilters(values);
  const rows = useMemo(() => agruparCampos(fields), [fields]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const updatePanelPosition = useCallback(() => {
    const trigger = rootRef.current;
    const panel = panelRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = Math.min(window.innerWidth - 32, 320);
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
    if (!visible) return;
    updatePanelPosition();
    const frame = requestAnimationFrame(() => updatePanelPosition());
    return () => cancelAnimationFrame(frame);
  }, [visible, fields, values, updatePanelPosition]);

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

  const renderControl = (field: DynamicFilterFieldDef, value: string) => {
    if (field.type === "select" && field.searchable) {
      return (
        <SelectSearch
          compact
          value={value}
          options={field.options ?? []}
          placeholder={field.placeholder ?? "Seleccionar"}
          searchPlaceholder={field.searchPlaceholder ?? "Buscar..."}
          disabled={field.disabled}
          onChange={(next) => setField(field.key, next)}
        />
      );
    }
    if (field.type === "select") {
      return (
        <Select
          value={value}
          options={field.options ?? []}
          placeholder={field.placeholder ?? "Seleccionar"}
          disabled={field.disabled}
          className={COMPACT_SELECT}
          onChange={(next) => setField(field.key, next)}
        />
      );
    }
    if (field.type === "date") {
      return (
        <Input
          type="date"
          value={value}
          className={COMPACT_CONTROL}
          onChange={(event) => setField(field.key, event.target.value)}
        />
      );
    }
    if (field.type === "checkbox") {
      return (
        <div className="flex h-9 items-center rounded-lg border border-gray-200 px-3 dark:border-gray-700">
          <Checkbox
            checked={value === "true"}
            label={field.placeholder ?? "Sí"}
            onChange={(checked) => setField(field.key, checked ? "true" : "")}
          />
        </div>
      );
    }
    return (
      <Input
        type="search"
        value={value}
        placeholder={field.placeholder ?? "Valor"}
        className={COMPACT_CONTROL}
        onChange={(event) => setField(field.key, event.target.value)}
      />
    );
  };

  const renderField = (field: DynamicFilterFieldDef) => {
    const value = values[field.key] ?? "";
    const active = isActiveFilterValue(value);
    return (
      <div key={field.key} className="min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <label className="truncate text-[11px] font-medium leading-4 text-gray-500 dark:text-gray-400">
            {field.label}
          </label>
          {active && (
            <button
              type="button"
              title="Limpiar filtro"
              onClick={() => setField(field.key, "")}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-white/5 dark:hover:text-brand-400"
            >
              <Icon name="mdi:close" size={12} />
            </button>
          )}
        </div>
        <div className="min-w-0">{renderControl(field, value)}</div>
      </div>
    );
  };

  const panel = visible && portalReady && (
    <div
      ref={panelRef}
      style={{ top: panelStyle.top, left: panelStyle.left, maxHeight: panelStyle.maxHeight }}
      className={`fixed z-[100000] flex w-[min(100vw-2rem,20rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900 ${popoverMotionClass(entered)}`}
    >
      <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3">
        <div className="space-y-2.5">
          {rows.map((row) =>
            row.length === 2 ? (
              <div key={`${row[0].key}-${row[1].key}`} className="grid grid-cols-2 gap-2">
                {row.map(renderField)}
              </div>
            ) : (
              renderField(row[0])
            ),
          )}
        </div>
      </div>

      <div className="flex shrink-0 justify-end border-t border-gray-200 px-3 py-2 dark:border-gray-800">
        <button
          type="button"
          disabled={activeCount === 0}
          onClick={clearAll}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-theme-xs font-medium text-error-600 transition hover:bg-error-50 disabled:pointer-events-none disabled:opacity-40 dark:text-error-400 dark:hover:bg-error-500/10"
        >
          <Icon name="mdi:broom" size={14} />
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
      {portalReady ? createPortal(panel, document.body) : null}
    </div>
  );
}

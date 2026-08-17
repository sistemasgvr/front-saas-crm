"use client";

import { useEffect } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { Icon } from "@/src/components/ui/Icon";

type Hook = flatpickr.Options.Hook;
type DateOption = flatpickr.Options.DateOption;

type DatePickerProps = {
  id: string;
  name?: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
};

export default function DatePicker({
  id,
  name,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  disabled,
  required,
}: DatePickerProps) {
  useEffect(() => {
    const instance = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate,
      onChange,
    });

    return () => {
      if (!Array.isArray(instance)) instance.destroy();
    };
  }, [mode, onChange, id, defaultDate]);

  return (
    <div>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="relative">
        <input
          id={id}
          name={name}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <Icon name="mdi:calendar-month-outline" size={22} />
        </span>
      </div>
    </div>
  );
}

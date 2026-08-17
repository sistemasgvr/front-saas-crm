"use client";

import { Icon } from "@/src/components/ui/Icon";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
}

export default function Select({
  options,
  placeholder = "Selecciona una opción",
  onChange,
  onBlur,
  className = "",
  defaultValue = "",
  value,
  name,
  id,
  required = false,
  disabled = false,
  error = false,
  hint,
}: SelectProps) {
  const selectedValue = value ?? defaultValue;
  const hasSelectedOption = options.some((option) => option.value === selectedValue);
  const resolvedOptions =
    selectedValue && !hasSelectedOption
      ? [...options, { value: selectedValue, label: selectedValue }]
      : options;

  return (
    <div>
      <div className="relative">
        <select
          id={id}
          name={name}
          required={required}
          disabled={disabled || resolvedOptions.length === 0}
          onBlur={onBlur}
          className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
            error
              ? "border-error-500 text-error-800 focus:ring-error-500/10 dark:border-error-500 dark:text-error-400"
              : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
          } ${selectedValue ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"} ${className}`}
          value={selectedValue}
          onChange={(event) => onChange?.(event.target.value)}
        >
          {placeholder ? (
            <option value="" disabled={required} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
              {resolvedOptions.length === 0 ? "No hay opciones disponibles" : placeholder}
            </option>
          ) : null}
          {resolvedOptions.map((option) => (
            <option key={option.value} value={option.value} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-0 flex h-11 items-center text-gray-500 dark:text-gray-400">
          <Icon name="mdi:chevron-down" size={20} />
        </span>
      </div>
      {hint ? <p className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}>{hint}</p> : null}
    </div>
  );
}

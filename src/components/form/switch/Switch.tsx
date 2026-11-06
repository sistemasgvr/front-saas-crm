"use client";

import { useState } from "react";

interface SwitchProps {
  /** Texto visible junto al switch. Sin él, pasa `ariaLabel` (p. ej. dentro de una tabla). */
  label?: string;
  ariaLabel?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  color?: "blue" | "gray";
}

/** Estilo de form/switch del template TailAdmin; admite modo controlado (`checked`). */
export default function Switch({
  label,
  ariaLabel,
  checked,
  defaultChecked = false,
  disabled = false,
  onChange,
  color = "blue",
}: SwitchProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const isChecked = checked ?? uncontrolled;

  const handleToggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (checked === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  const switchColors =
    color === "blue"
      ? {
          background: isChecked ? "bg-brand-500 " : "bg-gray-200 dark:bg-white/10",
          knob: isChecked ? "translate-x-full bg-white" : "translate-x-0 bg-white",
        }
      : {
          background: isChecked ? "bg-gray-800 dark:bg-white/10" : "bg-gray-200 dark:bg-white/10",
          knob: isChecked ? "translate-x-full bg-white" : "translate-x-0 bg-white",
        };

  return (
    <div
      className={`flex select-none items-center gap-3 text-sm font-medium ${
        disabled ? "text-gray-400" : "text-gray-700 dark:text-gray-400"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        onClick={handleToggle}
        className={`relative ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`block h-6 w-11 rounded-full transition duration-150 ease-linear ${
            disabled ? "pointer-events-none bg-gray-100 dark:bg-gray-800" : switchColors.background
          }`}
        />
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-theme-sm duration-150 ease-linear transform ${switchColors.knob}`}
        />
      </button>
      {label ? <span>{label}</span> : null}
    </div>
  );
}

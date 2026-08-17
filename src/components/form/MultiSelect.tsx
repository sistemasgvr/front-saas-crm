"use client";

import { useState } from "react";
import { Icon } from "@/src/components/ui/Icon";

interface Option {
  value: string;
  text: string;
  selected: boolean;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  name?: string;
  placeholder?: string;
}

export default function MultiSelect({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
  name,
  placeholder = "Selecciona una opción",
}: MultiSelectProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const updateSelected = (next: string[]) => {
    setSelectedOptions(next);
    onChange?.(next);
  };

  const handleSelect = (optionValue: string) => {
    updateSelected(
      selectedOptions.includes(optionValue)
        ? selectedOptions.filter((value) => value !== optionValue)
        : [...selectedOptions, optionValue],
    );
  };

  const removeOption = (value: string) => {
    updateSelected(selectedOptions.filter((option) => option !== value));
  };

  const selectedValuesText = selectedOptions.map(
    (value) => options.find((option) => option.value === value)?.text || "",
  );

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{label}</label>
      {name
        ? selectedOptions.map((value) => <input key={value} type="hidden" name={name} value={value} />)
        : null}

      <div className="relative z-20 inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div onClick={toggleDropdown} className="w-full">
            <div className="mb-2 flex h-11 rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs outline-hidden transition focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300">
              <div className="flex flex-auto flex-wrap gap-2">
                {selectedValuesText.length > 0 ? (
                  selectedValuesText.map((text, index) => (
                    <div
                      key={`${selectedOptions[index]}-${text}`}
                      className="group flex items-center justify-center rounded-full border-[0.7px] border-transparent bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 hover:border-gray-200 dark:bg-gray-800 dark:text-white/90 dark:hover:border-gray-800"
                    >
                      <span className="max-w-full flex-initial">{text}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeOption(selectedOptions[index]);
                        }}
                        className="cursor-pointer pl-2 text-gray-500 group-hover:text-gray-400 dark:text-gray-400"
                        aria-label={`Quitar ${text}`}
                      >
                        <Icon name="mdi:close" size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="p-1 pr-2 text-sm text-gray-500 dark:text-white/90">{placeholder}</span>
                )}
              </div>
              <div className="flex w-7 items-center py-1 pl-1 pr-1">
                <span className="h-5 w-5 text-gray-700 dark:text-gray-400">
                  <Icon name="mdi:chevron-down" size={20} className={isOpen ? "rotate-180" : ""} />
                </span>
              </div>
            </div>
          </div>

          {isOpen ? (
            <div
              className="absolute left-0 top-full z-40 max-h-select w-full overflow-y-auto rounded-lg bg-white shadow-sm dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col">
                {options.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className="w-full cursor-pointer rounded-t border-b border-gray-200 hover:bg-brand-500/5 dark:border-gray-800"
                    onClick={() => handleSelect(option.value)}
                  >
                    <div
                      className={`relative flex w-full items-center p-2 pl-2 ${
                        selectedOptions.includes(option.value) ? "bg-brand-500/10" : ""
                      }`}
                    >
                      <div className="mx-2 leading-6 text-gray-800 dark:text-white/90">{option.text}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

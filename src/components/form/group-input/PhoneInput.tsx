"use client";

import { useState } from "react";
import { Icon } from "@/src/components/ui/Icon";

interface CountryCode {
  code: string;
  label: string;
}

interface PhoneInputProps {
  countries: CountryCode[];
  placeholder?: string;
  onChange?: (phoneNumber: string) => void;
  selectPosition?: "start" | "end";
  name?: string;
  id?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function PhoneInput({
  countries,
  placeholder = "+51 999 000 000",
  onChange,
  selectPosition = "start",
  name,
  id,
  defaultValue,
  disabled = false,
  required = false,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]?.code ?? "");
  const [phoneNumber, setPhoneNumber] = useState(defaultValue ?? countries[0]?.label ?? "");

  const countryCodes: Record<string, string> = countries.reduce(
    (acc, { code, label }) => ({ ...acc, [code]: label }),
    {},
  );

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCountry = event.target.value;
    setSelectedCountry(nextCountry);
    setPhoneNumber(countryCodes[nextCountry]);
    onChange?.(countryCodes[nextCountry]);
  };

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextNumber = event.target.value;
    setPhoneNumber(nextNumber);
    onChange?.(nextNumber);
  };

  return (
    <div className="relative flex">
      {selectPosition === "start" && (
        <div className="absolute">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            disabled={disabled}
            className="appearance-none rounded-l-lg border-0 border-r border-gray-200 bg-transparent bg-none py-3 pl-3.5 pr-8 leading-tight text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-gray-400"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                {country.code}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-700 dark:text-gray-400">
            <Icon name="mdi:chevron-down" size={20} />
          </div>
        </div>
      )}

      <input
        id={id}
        name={name}
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`h-11 w-full ${
          selectPosition === "start" ? "pl-[84px]" : "pr-[84px]"
        } rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800`}
      />

      {selectPosition === "end" && (
        <div className="absolute right-0">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            disabled={disabled}
            className="appearance-none rounded-r-lg border-0 border-l border-gray-200 bg-transparent bg-none py-3 pl-3.5 pr-8 leading-tight text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-gray-400"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code} className="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                {country.code}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-700 dark:text-gray-400">
            <Icon name="mdi:chevron-down" size={20} />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { forwardRef, useState } from "react";
import Input from "@/src/components/form/input/InputField";
import { Icon } from "@/src/components/ui/Icon";

interface PasswordInputProps {
  id?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  error?: boolean;
  hint?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { id, name, placeholder, defaultValue, required, disabled, autoComplete, error, hint, onChange, onBlur },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          error={error}
          onChange={onChange}
          onBlur={onBlur}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-4 top-0 z-30 flex h-11 cursor-pointer items-center text-gray-500 dark:text-gray-400"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <Icon name={showPassword ? "mdi:eye" : "mdi:eye-off"} size={20} />
        </button>
      </div>
      {hint ? <p className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}>{hint}</p> : null}
    </div>
  );
});

export default PasswordInput;

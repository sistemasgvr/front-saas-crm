"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/src/components/ui/button/Button";
import Input from "@/src/components/form/input/InputField";

/** Formulario simple: el usuario pega el código que le dio Facebook/Meta. */
export default function ConsultarEstadoEliminacionForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function consultar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = codigo.trim();
    if (!limpio) {
      setError("Ingresa el código de confirmación que recibiste.");
      return;
    }
    setError(null);
    router.push(`/eliminacion-datos/${encodeURIComponent(limpio)}`);
  }

  return (
    <form
      onSubmit={consultar}
      className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <label htmlFor="codigo-eliminacion" className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
        Código de confirmación
      </label>
      <Input
        id="codigo-eliminacion"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        placeholder="Pega aquí el código que te enviaron"
        autoComplete="off"
      />
      {error ? <p className="text-theme-xs text-error-500">{error}</p> : null}
      <Button type="submit" size="sm">
        Ver estado
      </Button>
    </form>
  );
}

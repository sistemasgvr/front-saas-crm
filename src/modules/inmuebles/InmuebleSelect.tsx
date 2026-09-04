"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import SelectSearch from "@/src/components/ui/filters/SelectSearch";
import Input from "@/src/components/form/input/InputField";
import { queryKeys } from "@/src/lib/query/keys";
import { getInmueblesFiltro } from "./queries";
import { etiquetaInmuebleFiltro } from "./types";

/**
 * Select del catálogo + referencia libre (compatibilidad).
 * - Al elegir del catálogo: emite id + etiqueta "CODIGO — Título".
 * - Al escribir texto libre: limpia el id y emite solo la referencia.
 */
export default function InmuebleSelect({
  inmuebleId,
  referencia,
  onChange,
  disabled,
  required,
}: {
  inmuebleId: string;
  referencia: string;
  onChange: (next: { inmuebleId: string; referencia: string }) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const filtroQuery = useQuery({
    queryKey: queryKeys.inmueblesFiltro,
    queryFn: getInmueblesFiltro,
  });

  const options = useMemo(
    () =>
      (filtroQuery.data ?? []).map((o) => ({
        value: o.id,
        label: etiquetaInmuebleFiltro(o),
      })),
    [filtroQuery.data],
  );

  return (
    <div className="space-y-2">
      <SelectSearch
        value={inmuebleId}
        options={options}
        placeholder={
          filtroQuery.isLoading
            ? "Cargando inmuebles…"
            : options.length === 0
              ? "Sin inmuebles en catálogo"
              : "Elige del catálogo"
        }
        searchPlaceholder="Buscar por código o título…"
        disabled={disabled || filtroQuery.isLoading}
        onChange={(id) => {
          const opt = options.find((o) => o.value === id);
          onChange({
            inmuebleId: id,
            referencia: opt?.label ?? "",
          });
        }}
      />
      <Input
        type="text"
        placeholder="O escribe una referencia libre (proyecto / dirección)"
        value={inmuebleId ? "" : referencia}
        disabled={disabled || Boolean(inmuebleId)}
        required={required && !inmuebleId}
        onChange={(e) =>
          onChange({ inmuebleId: "", referencia: e.target.value })
        }
      />
      {inmuebleId ? (
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
          Seleccionado: {referencia}
          {" · "}
          <button
            type="button"
            className="underline"
            onClick={() => onChange({ inmuebleId: "", referencia: "" })}
          >
            Quitar y escribir libre
          </button>
        </p>
      ) : null}
    </div>
  );
}

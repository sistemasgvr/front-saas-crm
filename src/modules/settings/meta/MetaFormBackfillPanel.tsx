"use client";

import { useState } from "react";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { backfillMetaPageFormAction } from "./actions";
import { aFechaInput, formatearFechaMeta, hoyFechaInput } from "./format";
import type { ResultadoBackfill } from "./types";

interface MetaFormBackfillPanelProps {
  pageId: string;
  formId: string;
  formNombre: string;
  /** Fecha de creación del formulario en el CRM (proxy del origen). */
  fechaCreacion?: string | null;
  onClose: () => void;
}

function acumularResultado(prev: ResultadoBackfill, next: ResultadoBackfill): ResultadoBackfill {
  return {
    importados: prev.importados + next.importados,
    yaExistian: prev.yaExistian + next.yaExistian,
    errores: prev.errores + next.errores,
    incompleto: next.incompleto,
    nextCursor: next.nextCursor,
  };
}

export default function MetaFormBackfillPanel({
  pageId,
  formId,
  formNombre,
  fechaCreacion,
  onClose,
}: MetaFormBackfillPanelProps) {
  const desdeOrigen = aFechaInput(fechaCreacion) || hoyFechaInput();
  const [desde, setDesde] = useState(desdeOrigen);
  const [hasta, setHasta] = useState(hoyFechaInput());
  const [resultado, setResultado] = useState<ResultadoBackfill | null>(null);

  const mutation = useAppMutation({
    mutationFn: (vars: { desde?: string; hasta?: string; cursor?: string }) =>
      backfillMetaPageFormAction(pageId, formId, vars),
    successMessage: "Reimportación completada",
  });

  const ejecutar = (opts?: { historialCompleto?: boolean; cursor?: string }) => {
    const payload =
      opts?.historialCompleto
        ? { cursor: opts.cursor }
        : {
            desde: desde || undefined,
            hasta: hasta || undefined,
            cursor: opts?.cursor,
          };

    mutation.mutate(payload, {
      onSuccess: (data) => {
        setResultado((prev) => (opts?.cursor && prev ? acumularResultado(prev, data) : data));
      },
    });
  };

  const aplicarRangoOrigen = () => {
    setDesde(desdeOrigen);
    setHasta(hoyFechaInput());
    setResultado(null);
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <Icon name="mdi:database-import-outline" size={20} />
          </span>
          <div>
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Reimportar leads de &quot;{formNombre}&quot;
            </p>
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Por defecto desde la creación del formulario
              {fechaCreacion ? ` (${formatearFechaMeta(fechaCreacion)})` : ""} hasta hoy. Los leads ya
              existentes no se duplican.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <Icon name="mdi:close" size={18} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          startIcon={<Icon name="mdi:calendar-range" size={16} />}
          disabled={mutation.isPending}
          onClick={aplicarRangoOrigen}
        >
          Desde origen hasta hoy
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          startIcon={<Icon name="mdi:history" size={16} />}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          onClick={() => ejecutar({ historialCompleto: true })}
        >
          Todo el historial
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="backfill-desde">Desde</Label>
          <Input id="backfill-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="backfill-hasta">Hasta</Label>
          <Input id="backfill-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          startIcon={<Icon name="mdi:download-outline" size={16} />}
          loading={mutation.isPending}
          disabled={mutation.isPending || !desde || !hasta}
          onClick={() => ejecutar()}
        >
          {mutation.isPending ? "Reimportando…" : "Reimportar rango"}
        </Button>
        {resultado?.incompleto && resultado.nextCursor && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            startIcon={<Icon name="mdi:skip-next-outline" size={16} />}
            loading={mutation.isPending}
            disabled={mutation.isPending}
            onClick={() => ejecutar({ cursor: resultado.nextCursor })}
          >
            Continuar lote
          </Button>
        )}
      </div>

      {resultado && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-white/[0.03]">
          <Icon
            name={resultado.errores > 0 ? "mdi:alert-circle-outline" : "mdi:check-circle-outline"}
            size={18}
            className={resultado.errores > 0 ? "mt-0.5 text-warning-500" : "mt-0.5 text-success-500"}
          />
          <p className="text-theme-sm text-gray-600 dark:text-gray-300">
            {resultado.importados} importados · {resultado.yaExistian} ya existían · {resultado.errores} errores
            {resultado.incompleto ? " · quedan más leads; usa \"Continuar lote\"" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { backfillMetaPageFormAction } from "./actions";
import type { ResultadoBackfill } from "./types";

interface MetaFormBackfillPanelProps {
  pageId: string;
  formId: string;
  formNombre: string;
  onClose: () => void;
}

export default function MetaFormBackfillPanel({ pageId, formId, formNombre, onClose }: MetaFormBackfillPanelProps) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [resultado, setResultado] = useState<ResultadoBackfill | null>(null);

  const mutation = useAppMutation({
    mutationFn: (cursor?: string) =>
      backfillMetaPageFormAction(pageId, formId, {
        desde: desde || undefined,
        hasta: hasta || undefined,
        cursor,
      }),
    successMessage: "Reimportación completada",
  });

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
          Reimportar leads de &quot;{formNombre}&quot;
        </p>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icon name="mdi:close" size={18} />
        </button>
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

      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          loading={mutation.isPending}
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate(undefined, {
              onSuccess: (data) => setResultado(data),
            })
          }
        >
          {mutation.isPending ? "Reimportando…" : "Reimportar"}
        </Button>
        {resultado?.incompleto && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={mutation.isPending}
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate(resultado.nextCursor, {
                onSuccess: (data) =>
                  setResultado({
                    importados: resultado.importados + data.importados,
                    yaExistian: resultado.yaExistian + data.yaExistian,
                    errores: resultado.errores + data.errores,
                    incompleto: data.incompleto,
                    nextCursor: data.nextCursor,
                  }),
              })
            }
          >
            Continuar
          </Button>
        )}
      </div>

      {resultado && (
        <p className="mt-3 text-theme-sm text-gray-600 dark:text-gray-300">
          {resultado.importados} importados · {resultado.yaExistian} ya existían · {resultado.errores} errores
          {resultado.incompleto ? " · quedan más leads, usa \"Continuar\"" : ""}
        </p>
      )}
    </div>
  );
}

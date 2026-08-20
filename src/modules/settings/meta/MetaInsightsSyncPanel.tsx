"use client";

import { useState } from "react";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { syncMetaAdAccountInsightsAction } from "./actions";
import type { ResultadoSyncInsights } from "./types";

function hace30Dias() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - 30);
  return fecha.toISOString().slice(0, 10);
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function MetaInsightsSyncPanel({ cuentaId }: { cuentaId: string }) {
  const [desde, setDesde] = useState(hace30Dias());
  const [hasta, setHasta] = useState(hoy());
  const [resultado, setResultado] = useState<ResultadoSyncInsights | null>(null);

  const mutation = useAppMutation({
    mutationFn: () => syncMetaAdAccountInsightsAction(cuentaId, desde, hasta),
    successMessage: "Métricas sincronizadas",
    invalidateKeys: [queryKeys.metaAdAccountProfile(cuentaId)],
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="mb-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">Sincronizar métricas (Insights)</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="insights-desde">Desde</Label>
          <Input id="insights-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="insights-hasta">Hasta</Label>
          <Input id="insights-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>
      <div className="mt-3">
        <Button
          type="button"
          size="sm"
          loading={mutation.isPending}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(undefined, { onSuccess: (data) => setResultado(data) })}
        >
          {mutation.isPending ? "Sincronizando…" : "Sincronizar métricas"}
        </Button>
      </div>
      {resultado && (
        <p className="mt-3 text-theme-sm text-gray-600 dark:text-gray-300">
          {resultado.filasCuenta} días de cuenta · {resultado.filasCampana} filas de campaña
          {resultado.errores > 0 ? ` · ${resultado.errores} errores` : ""}
        </p>
      )}
    </div>
  );
}

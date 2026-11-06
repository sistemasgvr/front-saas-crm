"use client";

import { useState } from "react";
import ComponentCard from "@/src/components/common/ComponentCard";
import Label from "@/src/components/form/Label";
import Alert from "@/src/components/ui/alert/Alert";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { syncMetaAdAccountInsightsAction as syncMetaAdAccountInsightsActionResult } from "./actions";
import type { ResultadoSyncInsights } from "./types";
import { unwrapServerAction } from "@/src/lib/action-result";
const syncMetaAdAccountInsightsAction = unwrapServerAction(syncMetaAdAccountInsightsActionResult);


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
    <ComponentCard
      title="Sincronizar métricas (Insights)"
      desc="Trae de Meta la inversión diaria de la cuenta y sus campañas en el rango elegido; con ella se calculan Inversión y CPL."
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Label htmlFor="insights-desde">Desde</Label>
          <Input id="insights-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="w-40">
          <Label htmlFor="insights-hasta">Hasta</Label>
          <Input id="insights-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <Button
          type="button"
          size="sm"
          loading={mutation.isPending}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(undefined, { onSuccess: (data) => setResultado(data) })}
        >
          {mutation.isPending ? "Sincronizando…" : "Sincronizar"}
        </Button>
      </div>
      {resultado && (
        <Alert
          variant={resultado.errores > 0 ? "warning" : "success"}
          message={`${resultado.filasCuenta} días de cuenta · ${resultado.filasCampana} filas de campaña${
            resultado.errores > 0 ? ` · ${resultado.errores} errores` : ""
          }`}
        />
      )}
    </ComponentCard>
  );
}

"use client";

import { useState } from "react";
import ComponentCard from "@/src/components/common/ComponentCard";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { saveCapiDatasetAction as saveCapiDatasetActionResult } from "./actions";
import { unwrapServerAction } from "@/src/lib/action-result";
const saveCapiDatasetAction = unwrapServerAction(saveCapiDatasetActionResult);


/** Configuración de Conversions API (Conversion Leads): manda a Meta el
 * resultado final de un lead (ganado/perdido/descartado) para que optimice
 * la entrega de Lead Ads por calidad real, no solo volumen
 * (PLAN-PIPELINE-INMOBILIARIA.md §20.5). El dataset se crea a mano en Meta
 * Events Manager — acá solo se guarda su id. */
export default function MetaCapiSettingsForm({ capiDatasetIdActual }: { capiDatasetIdActual: string | null }) {
  const [capiDatasetId, setCapiDatasetId] = useState(capiDatasetIdActual ?? "");

  const mutation = useAppMutation({
    mutationFn: (value: string) => saveCapiDatasetAction(value),
    successMessage: capiDatasetId ? "Dataset de Conversions API guardado" : "Envío de eventos a Meta desactivado",
    invalidateKeys: [queryKeys.metaConnection],
  });

  return (
    <ComponentCard
      title="Conversions API — Conversion Leads"
      desc={
        <>
          Cuando un lead se marca como ganado, perdido o descartado, se le avisa a Meta con este dataset de{" "}
          <span className="text-gray-700 dark:text-gray-300">Events Manager</span> para que optimice la entrega de
          campañas por calidad real. Déjalo vacío para no mandar nada.
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(capiDatasetId.trim());
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Label htmlFor="capiDatasetId">Dataset ID</Label>
          <Input
            id="capiDatasetId"
            placeholder="Ej: 1234567890123456"
            value={capiDatasetId}
            onChange={(e) => setCapiDatasetId(e.target.value)}
            disabled={mutation.isPending}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          loading={mutation.isPending}
          startIcon={<Icon name="mdi:content-save-outline" size={18} />}
        >
          Guardar
        </Button>
      </form>
    </ComponentCard>
  );
}

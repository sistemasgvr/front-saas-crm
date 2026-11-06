"use client";

import { useState } from "react";
import ComponentCard from "@/src/components/common/ComponentCard";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Alert from "@/src/components/ui/alert/Alert";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { backfillMetaPageFormAction as backfillMetaPageFormActionResult } from "./actions";
import { aFechaInput, formatearFechaMeta, hoyFechaInput } from "./format";
import type { ResultadoBackfill } from "./types";
import { unwrapServerAction } from "@/src/lib/action-result";
const backfillMetaPageFormAction = unwrapServerAction(backfillMetaPageFormActionResult);


/** Meta Lead Ads: leads suelen estar disponibles ~90 días vía API. */
const DIAS_RETENCION_META = 90;
const AVISO_RETENCION_META =
  "La API de Meta retiene leads unos ~90 días; los más antiguos no se devolverán.";

interface MetaFormBackfillPanelProps {
  pageId: string;
  formId: string;
  formNombre: string;
  /** Fecha de creación del formulario en el CRM (proxy del origen). */
  fechaCreacion?: string | null;
  onClose: () => void;
}

function diasAntesDeHoy(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d;
}

function origenFueraDeRetencion(fechaCreacion?: string | null): boolean {
  if (!fechaCreacion) return false;
  const origen = new Date(fechaCreacion);
  if (Number.isNaN(origen.getTime())) return false;
  return origen.getTime() < diasAntesDeHoy(DIAS_RETENCION_META).getTime();
}

function acumularResultado(prev: ResultadoBackfill, next: ResultadoBackfill): ResultadoBackfill {
  return {
    importados: prev.importados + next.importados,
    yaExistian: prev.yaExistian + next.yaExistian,
    errores: prev.errores + next.errores,
    incompleto: next.incompleto,
    nextCursor: next.nextCursor,
    rangoRecortadoPorRetencion:
      prev.rangoRecortadoPorRetencion === true || next.rangoRecortadoPorRetencion === true,
    avisoRetencion: next.avisoRetencion ?? prev.avisoRetencion,
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
  const [avisoOrigen, setAvisoOrigen] = useState(origenFueraDeRetencion(fechaCreacion));

  const mutation = useAppMutation({
    mutationFn: (vars: { desde?: string; hasta?: string; cursor?: string }) =>
      backfillMetaPageFormAction(pageId, formId, vars),
    successMessage: "Reimportación completada",
    // Refresca conteo CRM, totales Meta, KPI de página y listado de leads.
    invalidateKeys: [
      queryKeys.metaPageForms(pageId),
      queryKeys.metaPageFormMetaCounts(pageId),
      queryKeys.metaPageProfile(pageId),
      ["leads"],
    ],
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
    setAvisoOrigen(origenFueraDeRetencion(fechaCreacion));
  };

  return (
    <ComponentCard
      title={`Reimportar leads de "${formNombre}"`}
      desc={`Por defecto desde la creación del formulario${
        fechaCreacion ? ` (${formatearFechaMeta(fechaCreacion)})` : ""
      } hasta hoy. Los leads ya existentes no se duplican.`}
      actions={
        <Button type="button" size="sm" variant="outline" startIcon={<Icon name="mdi:close" size={16} />} onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <Alert variant="info" message={AVISO_RETENCION_META} />

      {avisoOrigen && (
        <Alert
          variant="warning"
          message="El origen del formulario es anterior a ~90 días. Puedes reimportar igual; el rango se ajustará a lo que Meta aún conserve."
        />
      )}

      <div className="flex flex-wrap gap-3">
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

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="backfill-desde">Desde</Label>
          <Input id="backfill-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="backfill-hasta">Hasta</Label>
          <Input id="backfill-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
        <Alert
          variant={resultado.errores > 0 ? "warning" : "success"}
          message={`${resultado.importados} importados · ${resultado.yaExistian} ya existían · ${resultado.errores} errores${
            resultado.incompleto ? ' · quedan más leads; usa "Continuar lote"' : ""
          }`}
        />
      )}
      {resultado && (resultado.avisoRetencion || resultado.rangoRecortadoPorRetencion) && (
        <Alert
          variant="info"
          message={
            resultado.avisoRetencion ??
            (resultado.rangoRecortadoPorRetencion
              ? "El rango se recortó a los ~90 días que Meta aún conserva."
              : AVISO_RETENCION_META)
          }
        />
      )}
    </ComponentCard>
  );
}

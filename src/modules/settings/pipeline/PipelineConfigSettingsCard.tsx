"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Button from "@/src/components/ui/button/Button";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import HelpTooltip from "@/src/components/ui/HelpTooltip";
import { Icon } from "@/src/components/ui/Icon";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { queryKeys } from "@/src/lib/query/keys";
import { getPipelineConfig } from "./queries";
import { updatePipelineConfigAction } from "./actions";
import type { PipelineConfigOverride } from "./types";

const TIPOS = ["COMPRA", "VENTA", "OTRO"] as const;
const CODIGO_RE = /^[A-Z][A-Z0-9_]*$/;
const TERMINALES = ["CERRADO_GANADO", "CERRADO_PERDIDO", "DESCARTADO"] as const;

function validarCliente(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return "El JSON debe ser un objeto con COMPRA, VENTA y OTRO";
  }
  const obj = raw as Record<string, unknown>;
  for (const tipo of TIPOS) {
    const embudo = obj[tipo];
    if (typeof embudo !== "object" || embudo === null || Array.isArray(embudo)) {
      return `Falta o es inválido el embudo ${tipo}`;
    }
    const e = embudo as Record<string, unknown>;
    if (!Array.isArray(e.estados) || e.estados.length === 0) {
      return `${tipo}.estados debe ser un arreglo no vacío`;
    }
    const vistos = new Set<string>();
    for (const codigo of e.estados) {
      if (typeof codigo !== "string" || !CODIGO_RE.test(codigo)) {
        return `${tipo}.estados: código inválido (${String(codigo)})`;
      }
      if (vistos.has(codigo)) return `${tipo}.estados: duplicado ${codigo}`;
      vistos.add(codigo);
    }
    if (!vistos.has("NUEVO")) return `${tipo}.estados debe incluir NUEVO`;
    for (const t of TERMINALES) {
      if (!vistos.has(t)) return `${tipo}.estados debe incluir ${t}`;
    }
    if (typeof e.transiciones !== "object" || e.transiciones === null || Array.isArray(e.transiciones)) {
      return `${tipo}.transiciones debe ser un objeto`;
    }
    const tr = e.transiciones as Record<string, unknown>;
    for (const estado of vistos) {
      const destinos = tr[estado];
      if (!Array.isArray(destinos)) {
        return `${tipo}.transiciones falta la clave ${estado}`;
      }
      for (const d of destinos) {
        if (typeof d !== "string" || !vistos.has(d)) {
          return `${tipo}.transiciones.${estado}: destino inválido (${String(d)})`;
        }
      }
      if ((TERMINALES as readonly string[]).includes(estado) && destinos.length > 0) {
        return `${tipo}.transiciones.${estado}: un terminal no puede tener salidas`;
      }
    }
  }
  return null;
}

export default function PipelineConfigSettingsCard() {
  const configQuery = useQuery({
    queryKey: queryKeys.organizationPipelineConfig,
    queryFn: getPipelineConfig,
  });

  const [texto, setTexto] = useState("");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (!configQuery.data) return;
    const fuente = configQuery.data.config ?? configQuery.data.defaults;
    setTexto(JSON.stringify(fuente, null, 2));
    setErrorLocal(null);
  }, [configQuery.data]);

  const preview = useMemo(() => {
    if (!configQuery.data) return undefined;
    return configQuery.data.usandoOverride ? "Personalizado" : "Defaults de código";
  }, [configQuery.data]);

  const guardar = useAppMutation({
    mutationFn: async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(texto);
      } catch {
        throw new Error("JSON inválido: revisa comas y comillas");
      }
      const err = validarCliente(parsed);
      if (err) throw new Error(err);
      return updatePipelineConfigAction(parsed as PipelineConfigOverride);
    },
    successMessage: "Pipeline guardado",
    invalidateKeys: [
      queryKeys.organizationPipelineConfig,
      queryKeys.leadsAll,
      ["leads", "pipeline-meta"],
      ["leads", "tablero"],
    ],
  });

  const restaurar = useAppMutation({
    mutationFn: () => updatePipelineConfigAction(null),
    successMessage: "Defaults restaurados",
    invalidateKeys: [
      queryKeys.organizationPipelineConfig,
      queryKeys.leadsAll,
      ["leads", "pipeline-meta"],
      ["leads", "tablero"],
    ],
  });

  const cargarDefaults = () => {
    if (!configQuery.data) return;
    setTexto(JSON.stringify(configQuery.data.defaults, null, 2));
    setErrorLocal(null);
    toast.message("Defaults cargados en el editor (aún no guardados)");
  };

  const onChangeTexto = (value: string) => {
    setTexto(value);
    try {
      const parsed = JSON.parse(value);
      setErrorLocal(validarCliente(parsed));
    } catch {
      setErrorLocal("JSON inválido");
    }
  };

  if (configQuery.isLoading) {
    return (
      <CollapsibleSection title="Pipeline de leads" icon="mdi:pipeline" defaultOpen={false}>
        <PageLoader label="Cargando pipeline…" />
      </CollapsibleSection>
    );
  }
  if (configQuery.isError) return <QueryError error={configQuery.error} />;

  return (
    <CollapsibleSection
      title="Pipeline de leads"
      icon="mdi:pipeline"
      help="Override JSON de estados y transiciones por tipo (Compra / Venta / Otro). Si está vacío en BD, se usan las matrices de código."
      preview={preview}
      badge={configQuery.data?.usandoOverride ? "Personalizado" : "Default"}
      badgeColor={configQuery.data?.usandoOverride ? "warning" : "light"}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-theme-sm text-gray-600 dark:text-gray-400">
            Edita el JSON completo. Cada tipo debe tener <code className="text-theme-xs">estados</code> y{" "}
            <code className="text-theme-xs">transiciones</code>. Incluye siempre NUEVO y los tres cierres.
          </p>
          <HelpTooltip
            content="Al guardar se valida en el servidor. «Restaurar defaults» borra el override de la organización."
            placement="bottom"
          />
        </div>

        <textarea
          value={texto}
          onChange={(e) => onChangeTexto(e.target.value)}
          spellCheck={false}
          rows={18}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-theme-xs text-gray-800 outline-none focus:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
          aria-label="Editor JSON del pipeline"
        />

        {errorLocal && (
          <p className="text-theme-sm text-error-600 dark:text-error-400">{errorLocal}</p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            startIcon={<Icon name="mdi:file-restore-outline" size={18} />}
            onClick={cargarDefaults}
          >
            Ver defaults
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            loading={restaurar.isPending}
            disabled={restaurar.isPending || !configQuery.data?.usandoOverride}
            startIcon={<Icon name="mdi:backup-restore" size={18} />}
            onClick={() => restaurar.mutate()}
          >
            Restaurar defaults
          </Button>
          <Button
            type="button"
            size="sm"
            loading={guardar.isPending}
            disabled={guardar.isPending || !!errorLocal}
            startIcon={<Icon name="mdi:content-save-outline" size={18} />}
            onClick={() => {
              guardar.mutate(undefined, {
                onError: (err) => {
                  setErrorLocal(err instanceof Error ? err.message : "Error al guardar");
                },
              });
            }}
          >
            {guardar.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  );
}

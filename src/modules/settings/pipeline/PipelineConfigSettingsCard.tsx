"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Button from "@/src/components/ui/button/Button";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import HelpTooltip from "@/src/components/ui/HelpTooltip";
import Input from "@/src/components/form/input/InputField";
import Label from "@/src/components/form/Label";
import { Icon } from "@/src/components/ui/Icon";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { queryKeys } from "@/src/lib/query/keys";
import { getPipelineConfig } from "./queries";
import { updatePipelineConfigAction } from "./actions";
import type { EmbudoPipelineConfig, PipelineConfigOverride } from "./types";

const TIPOS = ["COMPRA", "VENTA", "OTRO"] as const;
type TipoEmbudo = (typeof TIPOS)[number];

const CODIGO_RE = /^[A-Z][A-Z0-9_]*$/;
const TERMINALES = ["CERRADO_GANADO", "CERRADO_PERDIDO", "DESCARTADO"] as const;
const PROTEGIDOS = new Set<string>(["NUEVO", ...TERMINALES]);

/** Icono MDI válido (`mdi:pipeline` no existe en Iconify → cuadro vacío). */
const ICONO_PIPELINE = "mdi:source-branch";

const ETIQUETA_TIPO: Record<TipoEmbudo, string> = {
  COMPRA: "Compra",
  VENTA: "Venta",
  OTRO: "Otro",
};

function clonarConfig(config: PipelineConfigOverride): PipelineConfigOverride {
  return structuredClone(config);
}

function etiquetaDe(embudo: EmbudoPipelineConfig, codigo: string): string {
  return embudo.etiquetas?.[codigo] ?? codigo.replaceAll("_", " ");
}

function validarConfig(config: PipelineConfigOverride): string | null {
  for (const tipo of TIPOS) {
    const embudo = config[tipo];
    if (!embudo?.estados?.length) return `${ETIQUETA_TIPO[tipo]}: añade al menos un estado`;
    const vistos = new Set<string>();
    for (const codigo of embudo.estados) {
      if (!CODIGO_RE.test(codigo)) return `${ETIQUETA_TIPO[tipo]}: código inválido (${codigo})`;
      if (vistos.has(codigo)) return `${ETIQUETA_TIPO[tipo]}: duplicado ${codigo}`;
      vistos.add(codigo);
    }
    if (!vistos.has("NUEVO")) return `${ETIQUETA_TIPO[tipo]}: debe incluir NUEVO`;
    for (const t of TERMINALES) {
      if (!vistos.has(t)) return `${ETIQUETA_TIPO[tipo]}: debe incluir ${t}`;
    }
    for (const estado of vistos) {
      const destinos = embudo.transiciones[estado];
      if (!Array.isArray(destinos)) {
        return `${ETIQUETA_TIPO[tipo]}: faltan transiciones de ${estado}`;
      }
      for (const d of destinos) {
        if (!vistos.has(d)) {
          return `${ETIQUETA_TIPO[tipo]}: ${estado} → ${d} no existe`;
        }
      }
      if ((TERMINALES as readonly string[]).includes(estado) && destinos.length > 0) {
        return `${ETIQUETA_TIPO[tipo]}: ${estado} es terminal y no puede tener salidas`;
      }
    }
  }
  return null;
}

function EmbudoEditor({
  tipo,
  embudo,
  onChange,
}: {
  tipo: TipoEmbudo;
  embudo: EmbudoPipelineConfig;
  onChange: (next: EmbudoPipelineConfig) => void;
}) {
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");

  const actualizarEtiqueta = (codigo: string, etiqueta: string) => {
    const etiquetas = { ...(embudo.etiquetas ?? {}) };
    const limpia = etiqueta.trim();
    if (!limpia || limpia === codigo.replaceAll("_", " ")) {
      delete etiquetas[codigo];
    } else {
      etiquetas[codigo] = limpia;
    }
    onChange({ ...embudo, etiquetas: Object.keys(etiquetas).length ? etiquetas : undefined });
  };

  const toggleDestino = (desde: string, hacia: string) => {
    if ((TERMINALES as readonly string[]).includes(desde)) return;
    const actual = embudo.transiciones[desde] ?? [];
    const next = actual.includes(hacia)
      ? actual.filter((d) => d !== hacia)
      : [...actual, hacia];
    onChange({
      ...embudo,
      transiciones: { ...embudo.transiciones, [desde]: next },
    });
  };

  const quitarEstado = (codigo: string) => {
    if (PROTEGIDOS.has(codigo)) {
      toast.error("Este estado es obligatorio y no se puede quitar");
      return;
    }
    const estados = embudo.estados.filter((e) => e !== codigo);
    const etiquetas = { ...(embudo.etiquetas ?? {}) };
    delete etiquetas[codigo];
    const transiciones: Record<string, string[]> = {};
    for (const e of estados) {
      transiciones[e] = (embudo.transiciones[e] ?? []).filter((d) => d !== codigo);
    }
    onChange({
      estados,
      transiciones,
      etiquetas: Object.keys(etiquetas).length ? etiquetas : undefined,
    });
  };

  const agregarEstado = () => {
    const codigo = nuevoCodigo.trim().toUpperCase().replace(/\s+/g, "_");
    if (!CODIGO_RE.test(codigo)) {
      toast.error("Usa MAYÚSCULAS_CON_GUION (ej. EN_SEGUIMIENTO)");
      return;
    }
    if (embudo.estados.includes(codigo)) {
      toast.error("Ese código ya existe");
      return;
    }
    const etiquetas = { ...(embudo.etiquetas ?? {}) };
    if (nuevaEtiqueta.trim()) etiquetas[codigo] = nuevaEtiqueta.trim();
    onChange({
      estados: [...embudo.estados.filter((e) => !(TERMINALES as readonly string[]).includes(e)), codigo, ...TERMINALES],
      transiciones: { ...embudo.transiciones, [codigo]: [] },
      etiquetas: Object.keys(etiquetas).length ? etiquetas : undefined,
    });
    setNuevoCodigo("");
    setNuevaEtiqueta("");
  };

  const mover = (codigo: string, dir: -1 | 1) => {
    const idx = embudo.estados.indexOf(codigo);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= embudo.estados.length) return;
    // No mover terminales fuera del bloque final ni NUEVO del inicio de forma rara:
    // permitimos reordenar libres; terminales se mantienen al final al guardar visualmente.
    if (PROTEGIDOS.has(codigo) && (TERMINALES as readonly string[]).includes(codigo)) return;
    if (codigo === "NUEVO") return;
    const estados = [...embudo.estados];
    [estados[idx], estados[swap]] = [estados[swap], estados[idx]];
    onChange({ ...embudo, estados });
  };

  return (
    <div className="space-y-4">
      <p className="text-theme-xs text-gray-500 dark:text-gray-400">
        Embudo <strong className="font-medium text-gray-700 dark:text-gray-200">{ETIQUETA_TIPO[tipo]}</strong>
        : define estados y a cuáles puede pasar cada uno. Los cierres no tienen salidas.
      </p>

      <ul className="space-y-3">
        {embudo.estados.map((codigo) => {
          const esTerminal = (TERMINALES as readonly string[]).includes(codigo);
          const protegido = PROTEGIDOS.has(codigo);
          const destinos = embudo.transiciones[codigo] ?? [];
          return (
            <li
              key={codigo}
              className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-white px-1.5 py-0.5 text-theme-xs font-semibold text-gray-800 dark:bg-gray-900 dark:text-white/90">
                      {codigo}
                    </code>
                    {protegido ? (
                      <span className="text-theme-xs text-gray-400">Obligatorio</span>
                    ) : null}
                    {esTerminal ? (
                      <span className="text-theme-xs text-gray-400">Terminal</span>
                    ) : null}
                  </div>
                  <div className="max-w-xs">
                    <Label htmlFor={`eti-${tipo}-${codigo}`}>Etiqueta en UI</Label>
                    <Input
                      id={`eti-${tipo}-${codigo}`}
                      value={etiquetaDe(embudo, codigo)}
                      onChange={(e) => actualizarEtiqueta(codigo, e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!esTerminal && codigo !== "NUEVO" ? (
                    <>
                      <button
                        type="button"
                        title="Subir"
                        className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 dark:hover:bg-white/10"
                        onClick={() => mover(codigo, -1)}
                      >
                        <Icon name="mdi:chevron-up" size={18} />
                      </button>
                      <button
                        type="button"
                        title="Bajar"
                        className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 dark:hover:bg-white/10"
                        onClick={() => mover(codigo, 1)}
                      >
                        <Icon name="mdi:chevron-down" size={18} />
                      </button>
                    </>
                  ) : null}
                  {!protegido ? (
                    <button
                      type="button"
                      title="Quitar estado"
                      className="rounded-md p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                      onClick={() => quitarEstado(codigo)}
                    >
                      <Icon name="mdi:trash-can-outline" size={18} />
                    </button>
                  ) : null}
                </div>
              </div>

              {!esTerminal ? (
                <div className="mt-3">
                  <p className="mb-1.5 text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                    Puede pasar a
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {embudo.estados
                      .filter((d) => d !== codigo)
                      .map((destino) => {
                        const activo = destinos.includes(destino);
                        return (
                          <button
                            key={destino}
                            type="button"
                            onClick={() => toggleDestino(codigo, destino)}
                            className={`rounded-full border px-2.5 py-1 text-theme-xs transition ${
                              activo
                                ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-300"
                                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-transparent dark:text-gray-400"
                            }`}
                          >
                            {etiquetaDe(embudo, destino)}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-theme-xs text-gray-400">Sin salidas (estado final).</p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">
        <p className="mb-2 text-theme-xs font-medium text-gray-700 dark:text-gray-200">Añadir estado</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Label htmlFor={`new-code-${tipo}`}>Código</Label>
            <Input
              id={`new-code-${tipo}`}
              placeholder="EN_SEGUIMIENTO"
              value={nuevoCodigo}
              onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase())}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Label htmlFor={`new-label-${tipo}`}>Etiqueta</Label>
            <Input
              id={`new-label-${tipo}`}
              placeholder="En seguimiento"
              value={nuevaEtiqueta}
              onChange={(e) => setNuevaEtiqueta(e.target.value)}
            />
          </div>
          <Button type="button" size="sm" variant="outline" onClick={agregarEstado}>
            Añadir
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PipelineConfigSettingsCard() {
  const configQuery = useQuery({
    queryKey: queryKeys.organizationPipelineConfig,
    queryFn: getPipelineConfig,
  });

  const [draft, setDraft] = useState<PipelineConfigOverride | null>(null);
  const [tipoActivo, setTipoActivo] = useState<TipoEmbudo>("COMPRA");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    if (!configQuery.data) return;
    const fuente = configQuery.data.config ?? configQuery.data.defaults;
    setDraft(clonarConfig(fuente));
    setErrorLocal(null);
  }, [configQuery.data]);

  const preview = useMemo(() => {
    if (!configQuery.data) return undefined;
    return configQuery.data.usandoOverride ? "Personalizado" : "Defaults de código";
  }, [configQuery.data]);

  const errorValidacion = useMemo(() => (draft ? validarConfig(draft) : null), [draft]);

  const guardar = useAppMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("Sin datos");
      const err = validarConfig(draft);
      if (err) throw new Error(err);
      return updatePipelineConfigAction(draft);
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
    setDraft(clonarConfig(configQuery.data.defaults));
    setErrorLocal(null);
    toast.message("Defaults cargados en el editor (aún no guardados)");
  };

  const actualizarEmbudo = (tipo: TipoEmbudo, embudo: EmbudoPipelineConfig) => {
    if (!draft) return;
    const next = { ...draft, [tipo]: embudo };
    setDraft(next);
    setErrorLocal(validarConfig(next));
  };

  if (configQuery.isLoading) {
    return (
      <CollapsibleSection title="Pipeline de leads" icon={ICONO_PIPELINE} defaultOpen={false}>
        <PageLoader label="Cargando pipeline…" />
      </CollapsibleSection>
    );
  }
  if (configQuery.isError) return <QueryError error={configQuery.error} />;
  if (!draft) return null;

  return (
    <CollapsibleSection
      title="Pipeline de leads"
      icon={ICONO_PIPELINE}
      help="Configura visualmente estados y transiciones por tipo (Compra / Venta / Otro). Si no hay override guardado, rigen las matrices de código."
      preview={preview}
      badge={configQuery.data?.usandoOverride ? "Personalizado" : "Default"}
      badgeColor={configQuery.data?.usandoOverride ? "warning" : "light"}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-theme-sm text-gray-600 dark:text-gray-400">
            Elige el tipo de lead y edita sus etapas. Pulsa una etapa destino para activar o desactivar la transición.
          </p>
          <HelpTooltip
            content="NUEVO y los tres cierres son obligatorios. «Restaurar defaults» borra el override de la organización."
            placement="bottom"
          />
        </div>

        <div
          className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-white/[0.02]"
          role="tablist"
          aria-label="Tipo de embudo"
        >
          {TIPOS.map((tipo) => {
            const activo = tipoActivo === tipo;
            return (
              <button
                key={tipo}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setTipoActivo(tipo)}
                className={`rounded-md px-3 py-1.5 text-theme-sm font-medium transition ${
                  activo
                    ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {ETIQUETA_TIPO[tipo]}
              </button>
            );
          })}
        </div>

        <EmbudoEditor
          tipo={tipoActivo}
          embudo={draft[tipoActivo]}
          onChange={(embudo) => actualizarEmbudo(tipoActivo, embudo)}
        />

        {(errorLocal || errorValidacion) && (
          <p className="text-theme-sm text-error-600 dark:text-error-400">
            {errorLocal ?? errorValidacion}
          </p>
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
            disabled={guardar.isPending || !!errorValidacion}
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

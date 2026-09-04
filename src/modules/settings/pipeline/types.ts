export interface EmbudoPipelineConfig {
  estados: string[];
  transiciones: Record<string, string[]>;
  etiquetas?: Record<string, string>;
}

export interface PipelineConfigOverride {
  COMPRA: EmbudoPipelineConfig;
  VENTA: EmbudoPipelineConfig;
  OTRO: EmbudoPipelineConfig;
}

export interface PipelineConfigResponse {
  config: PipelineConfigOverride | null;
  defaults: PipelineConfigOverride;
  usandoOverride: boolean;
}

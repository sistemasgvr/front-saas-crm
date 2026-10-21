export interface BotPreferencias {
  modoInicial: "HUMANO" | "BOT";
  preferenciasVersion: number;
  autorizado: boolean;
  clientesHabilitados: boolean;
  habilitadoPlataforma: boolean;
  automatizacionesHabilitado: boolean;
  whatsappHabilitado: boolean;
  integracion: {
    proveedor: string;
    alcance: string;
    configurada: boolean;
    operativa: boolean;
    estado: string;
  };
}

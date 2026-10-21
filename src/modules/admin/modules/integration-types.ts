export interface AutomationIntegration {
  webhookUrl: string;
  headerNombre: string;
  version: number;
  credencialConfigurada: boolean;
  configurada: boolean;
  operativa: boolean;
  actualizadoEn: string | null;
}
export interface AutomationIntegrationInput {
  webhookUrl: string;
  headerNombre: string;
  version: number;
  secreto?: string;
  eliminarSecreto?: boolean;
}

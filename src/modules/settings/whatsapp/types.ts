export interface NumeroWhatsAppDisponible {
  wabaId: string;
  wabaNombre: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
  codeVerificationStatus?: string;
  qualityRating?: string;
}

export interface PlantillaWhatsApp {
  nombre: string;
  idioma: string;
  categoria: string;
  estado: string;
}

export interface WhatsappConexion {
  id: string;
  wabaId: string;
  phoneNumberId: string;
  numeroDisplay: string | null;
  nombreVerificado: string | null;
  estadoNumero: string | null;
  webhookSuscrito: boolean;
  webhookSuscritoEn: string | null;
  webhookUltimoCheckEn: string | null;
  webhookUltimoError: string | null;
  fechaCreacion: string;
}

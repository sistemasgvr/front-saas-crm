export interface ReferenciaNombrada {
  id: string;
  nombre: string;
}

export interface ConversacionResumen {
  id: string;
  waId: string;
  nombreContacto: string | null;
  lead: (ReferenciaNombrada & { asignadoUsuarioId: string | null }) | null;
  ultimoMensajeEn: string | null;
  ventanaExpiraEn: string | null;
  noLeidos: number;
  ultimoMensajeTexto: string | null;
}

export interface Mensaje {
  id: string;
  wamid: string;
  direccion: "entrante" | "saliente";
  tipo: string;
  texto: string | null;
  plantillaNombre: string | null;
  estadoEntrega: string | null;
  fechaMensaje: string;
}

export interface ConversacionDetalle extends ConversacionResumen {
  mensajes: Mensaje[];
}

export interface PlantillaWhatsApp {
  nombre: string;
  idioma: string;
  categoria: string;
  estado: string;
  cuerpoTexto?: string;
}

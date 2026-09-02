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
  /** text | template | image | document | audio | video | sticker */
  tipo: string;
  texto: string | null;
  plantillaNombre: string | null;
  estadoEntrega: string | null;
  fechaMensaje: string;
  tieneMedia: boolean;
  mediaMimeType: string | null;
  mediaNombreArchivo: string | null;
  mediaCaption: string | null;
  mediaEsVoz: boolean | null;
  mediaTamanoBytes: number | null;
  /** Emoji que pusimos nosotros sobre este mensaje — null si ninguno. */
  reaccionAgente: string | null;
  /** Emoji que puso el contacto sobre este mensaje — null si ninguno. */
  reaccionCliente: string | null;
  /** Mensaje citado (respuesta contextual) — null si este mensaje no responde a nada. */
  respondeA: MensajeCitado | null;
}

/** Vista chica del mensaje citado — lo justo para pintar la burbujita de cita. */
export interface MensajeCitado {
  id: string;
  direccion: "entrante" | "saliente";
  tipo: string;
  texto: string | null;
  tieneMedia: boolean;
  mediaCaption: string | null;
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
  /** 'NAMED' | 'POSITIONAL' — cómo Meta espera los parámetros al enviarla. */
  formatoParametros?: string;
}

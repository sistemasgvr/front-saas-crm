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
  bloqueado: boolean;
}

export interface Mensaje {
  id: string;
  wamid: string;
  direccion: "entrante" | "saliente";
  /** text | template | image | document | audio | video | sticker | location | contacts */
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
  /** Solo si tipo === "location". */
  ubicacion: UbicacionMensaje | null;
  /** Solo si tipo === "contacts" — puede traer varios. */
  contactos: ContactoMensaje[] | null;
  /** Cuándo el contacto editó este mensaje por última vez — null si nunca. */
  fechaEdicion: string | null;
  /** Solo si tipo === "interactive" — lo que NOSOTROS mandamos. La
   * respuesta del contacto (qué tocó) llega como mensaje normal, con
   * tipo "button_reply" | "list_reply" y el título elegido en `texto`. */
  interactivo: Interactivo | null;
}

export interface BotonInteractivo {
  id: string;
  titulo: string;
}

export interface FilaLista {
  id: string;
  titulo: string;
  descripcion?: string;
}

export interface SeccionLista {
  titulo?: string;
  filas: FilaLista[];
}

export interface Interactivo {
  subtipo: "button" | "list" | "cta_url" | "location_request";
  cuerpo: string;
  pie?: string;
  /** Solo subtipo "button" — hasta 3. */
  botones?: BotonInteractivo[];
  /** Solo subtipo "list". */
  botonLista?: string;
  secciones?: SeccionLista[];
  /** Solo subtipo "cta_url". */
  textoBoton?: string;
  url?: string;
}

export interface UbicacionMensaje {
  latitud: number;
  longitud: number;
  nombre: string | null;
  direccion: string | null;
}

export interface ContactoMensaje {
  nombre: string;
  telefonos: { numero: string; tipo?: string }[];
  organizacion?: string;
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

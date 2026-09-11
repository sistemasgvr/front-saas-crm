import type { Mensaje } from "./types";
import { textoWhatsAppPlano } from "./texto-whatsapp-plano";

/** Preview de lista de chats — mismo criterio que el backend. */
export function previewUltimoMensaje(m: Pick<Mensaje, "texto" | "mediaCaption" | "tipo" | "mediaEsVoz">): string | null {
  const texto = m.texto?.trim();
  if (texto) return textoWhatsAppPlano(texto).slice(0, 200);

  const caption = m.mediaCaption?.trim();
  if (caption) return textoWhatsAppPlano(caption).slice(0, 200);

  switch (m.tipo) {
    case "image":
      return "Imagen";
    case "video":
      return "Video";
    case "audio":
      return m.mediaEsVoz ? "Nota de voz" : "Audio";
    case "document":
      return "Documento";
    case "sticker":
      return "Sticker";
    case "location":
      return "Ubicación";
    case "contacts":
      return "Contacto";
    case "template":
      return "Plantilla";
    case "interactive":
      return "Mensaje interactivo";
    case "button":
    case "button_reply":
      return "Tocó un botón";
    case "list_reply":
      return "Eligió de la lista";
    case "nfm_reply":
      return "Respondió un formulario";
    case "order":
      return "Pedido";
    case "system":
      return "Mensaje del sistema";
    case "unsupported":
      return "Meta no envió el contenido";
    default:
      return m.tipo ? "Mensaje" : null;
  }
}

/** Etiqueta visible cuando el mensaje no tiene texto/cuerpo recuperable. */
export function etiquetaTipoMensajeVacio(
  tipo: string,
  mediaEsVoz?: boolean | null,
): string {
  return previewUltimoMensaje({
    texto: null,
    mediaCaption: null,
    tipo,
    mediaEsVoz: mediaEsVoz ?? null,
  }) ?? "(sin contenido)";
}

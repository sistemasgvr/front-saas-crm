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
    default:
      return m.tipo ? "Mensaje" : null;
  }
}

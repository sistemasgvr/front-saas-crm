import type { ConversacionResumen } from "./types";
import type { BorradoresPorChat } from "./chat-borradores";
import { etiquetaConversacion } from "./etiqueta-conversacion";

/** Filtra la lista de chats como WhatsApp Web: nombre, teléfono, username, BSUID, preview y borrador. */
export function filtrarConversaciones(
  chats: ConversacionResumen[],
  q: string,
  borradores: BorradoresPorChat = {},
): ConversacionResumen[] {
  const term = q.trim().toLowerCase();
  if (!term) return chats;

  const soloDigitos = term.replace(/\D/g, "");

  return chats.filter((chat) => {
    const nombre = etiquetaConversacion(chat).toLowerCase();
    const preview = (chat.ultimoMensajeTexto ?? "").toLowerCase();
    const borrador = (borradores[chat.id] ?? "").toLowerCase();
    const waId = (chat.waId ?? "").toLowerCase();
    const username = (chat.username ?? "").toLowerCase();
    const bsuid = (chat.bsuid ?? "").toLowerCase();

    if (
      nombre.includes(term) ||
      preview.includes(term) ||
      borrador.includes(term) ||
      waId.includes(term) ||
      username.includes(term) ||
      bsuid.includes(term) ||
      (username && `@${username}`.includes(term))
    ) {
      return true;
    }

    if (soloDigitos.length >= 3 && chat.waId) {
      const waDigitos = chat.waId.replace(/\D/g, "");
      return waDigitos.includes(soloDigitos);
    }

    return false;
  });
}

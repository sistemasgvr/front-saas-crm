import type { ConversacionResumen } from "./types";
import type { BorradoresPorChat } from "./chat-borradores";

/** Filtra la lista de chats como WhatsApp Web: nombre, teléfono, preview y borrador. */
export function filtrarConversaciones(
  chats: ConversacionResumen[],
  q: string,
  borradores: BorradoresPorChat = {},
): ConversacionResumen[] {
  const term = q.trim().toLowerCase();
  if (!term) return chats;

  const soloDigitos = term.replace(/\D/g, "");

  return chats.filter((chat) => {
    const nombre = (chat.lead?.nombre ?? chat.nombreContacto ?? chat.waId).toLowerCase();
    const preview = (chat.ultimoMensajeTexto ?? "").toLowerCase();
    const borrador = (borradores[chat.id] ?? "").toLowerCase();
    const waId = chat.waId.toLowerCase();

    if (
      nombre.includes(term) ||
      preview.includes(term) ||
      borrador.includes(term) ||
      waId.includes(term)
    ) {
      return true;
    }

    if (soloDigitos.length >= 3) {
      const waDigitos = chat.waId.replace(/\D/g, "");
      return waDigitos.includes(soloDigitos);
    }

    return false;
  });
}

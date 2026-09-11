import type { ConversacionResumen } from "./types";

/** Nombre visible del chat: lead → perfil → @username → +tel → WhatsApp. */
export function etiquetaConversacion(
  chat: Pick<
    ConversacionResumen,
    "lead" | "nombreContacto" | "username" | "waId"
  >,
): string {
  const leadNombre = chat.lead?.nombre?.trim();
  if (leadNombre) return leadNombre;
  const contacto = chat.nombreContacto?.trim();
  if (contacto) return contacto;
  const user = chat.username?.trim();
  if (user) return user.startsWith("@") ? user : `@${user}`;
  if (chat.waId) return `+${chat.waId}`;
  return "WhatsApp";
}

/** Subtítulo (teléfono / username) bajo el nombre del chat. */
export function subtituloConversacion(
  chat: Pick<ConversacionResumen, "waId" | "username">,
): string | null {
  if (chat.waId) return `+${chat.waId}`;
  if (chat.username) {
    const u = chat.username.trim();
    return u.startsWith("@") ? u : `@${u}`;
  }
  return null;
}

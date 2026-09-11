/** Se puede abrir/iniciar chat si hay teléfono o el lead ya nació de WhatsApp
 * (puede tener solo username/BSUID y chat vinculado). */
export function puedeIniciarChatDesdeLead(lead: {
  telefono: string | null;
  origen: string;
}): boolean {
  if (lead.telefono?.trim()) return true;
  return lead.origen === "WHATSAPP";
}

export function tituloIniciarChatDeshabilitado(
  whatsappHabilitado: boolean,
  lead: { telefono: string | null; origen: string },
): string | undefined {
  if (!whatsappHabilitado) {
    return "Activa el módulo WhatsApp en Configuración";
  }
  if (!puedeIniciarChatDesdeLead(lead)) {
    return "Este lead no tiene teléfono ni chat de WhatsApp vinculado";
  }
  return undefined;
}

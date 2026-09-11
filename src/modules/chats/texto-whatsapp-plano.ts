/**
 * Quita marcadores de formato WhatsApp para previews (sidebar / citas).
 * No renderiza HTML — solo texto plano.
 */
export function textoWhatsAppPlano(texto: string): string {
  return texto
    .replace(/```([\s\S]*?)```/g, "$1")
    .replace(/`([^`\n]+?)`/g, "$1")
    .replace(/\*\*(?!\s)([\s\S]+?)(?<!\s)\*\*/g, "$1")
    .replace(/\*(?!\s|\*)([^*\n]+?)(?<!\s|\*)\*/g, "$1")
    .replace(/_(?!\s)([^_\n]+?)(?<!\s)_/g, "$1")
    .replace(/~(?!\s)([^~\n]+?)(?<!\s)~/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^(?:[-*]|\u2022)\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type SignupEvent = { event: string; wabaId?: string; phoneNumberId?: string };

/** Dominio con límite real: evilfacebook.com y facebook.com.evil.test no son Meta.
 * La prueba final de acceso al activo se realiza siempre en el backend. */
export function parseSignupEvent(origin: string, payload: unknown): SignupEvent | null {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" || url.port || !(url.hostname === "facebook.com" || url.hostname.endsWith(".facebook.com"))) return null;
    const parsed: unknown = typeof payload === "string" ? JSON.parse(payload) : payload;
    if (!parsed || typeof parsed !== "object") return null;
    const data = parsed as Record<string, unknown>;
    if (data.type !== "WA_EMBEDDED_SIGNUP" || typeof data.event !== "string") return null;
    const assets = data.data && typeof data.data === "object" ? data.data as Record<string, unknown> : {};
    return { event: data.event,
      wabaId: typeof assets.waba_id === "string" && /^\d+$/.test(assets.waba_id) ? assets.waba_id : undefined,
      phoneNumberId: typeof assets.phone_number_id === "string" && /^\d+$/.test(assets.phone_number_id) ? assets.phone_number_id : undefined };
  } catch { return null; }
}

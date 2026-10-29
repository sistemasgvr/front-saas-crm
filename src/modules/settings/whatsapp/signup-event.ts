export type SignupEvent = {
  event: string;
  wabaId?: string;
  phoneNumberId?: string;
  /** CANCEL/ERROR: paso donde se abandonó y detalle que informa Meta. */
  currentStep?: string;
  errorMessage?: string;
  errorCode?: string;
  sessionId?: string;
};

const texto = (value: unknown) => typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : undefined;

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
      phoneNumberId: typeof assets.phone_number_id === "string" && /^\d+$/.test(assets.phone_number_id) ? assets.phone_number_id : undefined,
      currentStep: texto(assets.current_step),
      errorMessage: texto(assets.error_message),
      errorCode: typeof assets.error_code === "number" ? String(assets.error_code) : texto(assets.error_code),
      sessionId: texto(assets.session_id) };
  } catch { return null; }
}

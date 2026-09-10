export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const REMEMBER_COOKIE = "remember_session";

/** Espejo de JWT_ACCESS_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN del backend. */
export const ACCESS_MAX_AGE = 60 * 15;
/** Sesión de navegador ~24h (el checkbox "Recordar email" no controla esto). */
export const REFRESH_MAX_AGE = 60 * 60 * 24;

export interface SessionCookie {
  name: string;
  value: string;
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge?: number;
}

function cookieOptions(persist: boolean, maxAge: number): Omit<SessionCookie, "name" | "value"> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(persist ? { maxAge } : {}),
  };
}

/**
 * Cookies de sesión. `persist` debe ser true en login:
 * sin maxAge el navegador/móvil las trata como cookies de sesión y se pierden
 * al cerrar la pestaña o al suspender la PWA.
 */
export function sessionCookies(
  accessToken: string,
  refreshToken: string,
  persist = true,
): SessionCookie[] {
  return [
    { name: ACCESS_COOKIE, value: accessToken, ...cookieOptions(persist, ACCESS_MAX_AGE) },
    { name: REFRESH_COOKIE, value: refreshToken, ...cookieOptions(persist, REFRESH_MAX_AGE) },
    { name: REMEMBER_COOKIE, value: persist ? "1" : "0", ...cookieOptions(persist, REFRESH_MAX_AGE) },
  ];
}

export function isAccessTokenUsable(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length < 2) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now() + 15_000;
  } catch {
    return false;
  }
}

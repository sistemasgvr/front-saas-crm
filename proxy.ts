import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  isAccessTokenUsable,
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  sessionCookies,
} from "@/src/lib/session-cookies";
import { getApiUrl } from "@/src/lib/api-url";

function withUpdatedCookies(
  request: NextRequest,
  cookiesToSet: ReturnType<typeof sessionCookies>,
) {
  const requestHeaders = new Headers(request.headers);
  const cookieMap = new Map(
    (request.headers.get("cookie") ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return [part.slice(0, separator), part.slice(separator + 1)] as const;
      }),
  );

  for (const cookie of cookiesToSet) {
    cookieMap.set(cookie.name, cookie.value);
  }

  requestHeaders.set(
    "cookie",
    [...cookieMap.entries()].map(([name, value]) => `${name}=${value}`).join("; "),
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie);
  }
  return response;
}

function clearAuthCookies(response: NextResponse) {
  const clear = { path: "/" as const };
  response.cookies.set(ACCESS_COOKIE, "", { ...clear, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...clear, maxAge: 0 });
  response.cookies.set(REMEMBER_COOKIE, "", { ...clear, maxAge: 0 });
  return response;
}

/** Corre en (casi) cada navegación — ver `config.matcher` abajo. */
const TIMEOUT_REFRESH_MS = 8_000;

export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  if (!refreshToken || isAccessTokenUsable(accessToken)) {
    return NextResponse.next();
  }

  try {
    const res = await fetch(`${getApiUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_REFRESH_MS),
    });

    // Solo cerrar sesión si el refresh es definitivamente inválido.
    // 5xx/429: conservar cookies para reintentar en la siguiente navegación.
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return clearAuthCookies(NextResponse.next());
      }
      return NextResponse.next();
    }

    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    // Siempre renovar con maxAge (sesión persistente ~24h).
    return withUpdatedCookies(request, sessionCookies(data.accessToken, data.refreshToken, true));
  } catch {
    // Timeout/red: no borrar cookies; la página puede fallar un request y reintentar.
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

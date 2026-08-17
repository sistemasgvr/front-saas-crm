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
    });

    if (!res.ok) {
      const response = NextResponse.next();
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      response.cookies.delete(REMEMBER_COOKIE);
      return response;
    }

    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    const persist = request.cookies.get(REMEMBER_COOKIE)?.value !== "0";
    return withUpdatedCookies(request, sessionCookies(data.accessToken, data.refreshToken, persist));
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  sessionCookies,
} from "@/src/lib/session-cookies";

export async function getAccessToken() {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken() {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

// Solo se puede llamar desde un Server Action o Route Handler (no desde el render de un Server Component).
export async function setSessionCookies(accessToken: string, refreshToken: string, persist = true) {
  const store = await cookies();
  for (const cookie of sessionCookies(accessToken, refreshToken, persist)) {
    store.set(cookie.name, cookie.value, cookie);
  }
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(REMEMBER_COOKIE);
}

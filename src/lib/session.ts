import { cookies } from 'next/headers';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

// Duraciones espejo de JWT_ACCESS_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN del backend (PLAN.md §12).
// Si difieren levemente no hay riesgo: el backend es la fuente de verdad de la validez real.
const ACCESS_MAX_AGE = 60 * 15;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export async function getAccessToken() {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken() {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

// Solo se puede llamar desde un Server Action o Route Handler (no desde el render de un Server Component).
export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_MAX_AGE,
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

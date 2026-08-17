import { getAccessToken } from './session';
import { getApiUrl } from './api-url';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function parseError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
  if (!body?.message) return res.statusText;
  return Array.isArray(body.message) ? body.message.join(', ') : body.message;
}

/** fetch público, sin token — usado por login. */
export async function publicFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
}

/**
 * fetch autenticado para Server Components (solo lectura de cookies).
 * Si el access token expiró, lanza ApiError(401) — quien llama decide
 * (normalmente: redirect a /login). El refresh en sí solo puede ejecutarse
 * desde un Server Action/Route Handler, que sí puede escribir cookies.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new ApiError(401, 'Sin sesión activa');
  }

  const res = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
